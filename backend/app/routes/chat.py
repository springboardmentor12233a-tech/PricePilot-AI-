from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.ai.ai_service import answer_chat
from app.ai.chat_router import route
from app.core import roles
from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import ChatMessage, ChatSession, User
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db),
         user: User = Depends(require_roles(*roles.CHAT_USERS))):
    session = None
    if payload.session_id:
        session = db.get(ChatSession, payload.session_id)
    if session is None:
        session = ChatSession(user_id=user.id, title=payload.message[:60])
        db.add(session)
        db.commit()
        db.refresh(session)

    db.add(ChatMessage(session_id=session.id, role="user", content=payload.message))
    db.commit()

    tool_context = route(db, payload.message)
    reply, source = answer_chat(payload.message, tool_context)

    db.add(ChatMessage(session_id=session.id, role="assistant", content=reply, tool_calls=tool_context))
    db.commit()
    log_action(db, user.id, "chat_message", {"source": source})

    return ChatResponse(session_id=session.id, reply=reply, tool_calls=tool_context)


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), user: User = Depends(require_roles(*roles.CHAT_USERS))):
    return db.query(ChatSession).filter(ChatSession.user_id == user.id).order_by(ChatSession.created_at.desc()).all()


@router.get("/sessions/{session_id}/messages")
def session_messages(session_id: str, db: Session = Depends(get_db),
                      _user: User = Depends(require_roles(*roles.CHAT_USERS))):
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
