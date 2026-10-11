"""
AI chatbot endpoint used by the frontend <ChatWidget/>.
POST /api/v1/ai/ask
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User
from app.services.llm_chat import SYSTEM_PROMPT, build_product_context, chat_completion
from app.services.llm_insights import GROQ_MODEL

router = APIRouter(prefix="/api/v1/ai", tags=["AI Chatbot"])


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., max_length=4000)


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=30)
    product_id: int | None = None  # optional: ground the answer in one product's data


class AskResponse(BaseModel):
    response: str
    model: str


@router.post("/ask", response_model=AskResponse)
def ask_ai(
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    system = SYSTEM_PROMPT
    if payload.product_id is not None:
        context = build_product_context(db, payload.product_id)
        if context is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Product not found")
        system += "\n\nLive data for the product being discussed:\n" + context

    messages = [{"role": "system", "content": system}]
    messages += [t.model_dump() for t in payload.history[-10:]]
    messages.append({"role": "user", "content": payload.message})

    try:
        answer = chat_completion(messages)
    except RuntimeError as e:
        # Missing key / rate limit / network: dependency problem, so 503
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    return AskResponse(response=answer, model=GROQ_MODEL)