"""
Alias to backend.app.api.routes.auth
"""
from backend.app.api.routes.auth import router, login, get_me, register

__all__ = ["router", "login", "get_me", "register"]
