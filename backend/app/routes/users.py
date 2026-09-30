"""
Alias to backend.app.api.routes.users
"""
from backend.app.api.routes.users import router, list_users, create_user, update_user, update_user_status, delete_user

__all__ = ["router", "list_users", "create_user", "update_user", "update_user_status", "delete_user"]
