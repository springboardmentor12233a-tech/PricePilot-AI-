from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .auth import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# Temporary users for Day 29 testing
users = {
    "admin": {
        "username": "admin",
        "password": hash_password("admin123"),
        "role": "admin"
    },

    "analyst": {
        "username": "analyst",
        "password": hash_password("analyst123"),
        "role": "business_analyst"
    },

    "user": {
        "username": "user",
        "password": hash_password("user123"),
        "role": "user"
    }
}


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(data: LoginRequest):

    user = users.get(data.username)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        data.password,
        user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_access_token({
        "sub": user["username"],
        "role": user["role"]
    })

    return {
        "status": "success",
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"]
    }