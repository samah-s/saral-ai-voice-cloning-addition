# # app/auth/dependencies.py
# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from typing import Optional
# from app.services.auth_service import auth_service

# security = HTTPBearer(auto_error=False)

# async def get_current_user(
#     credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
# ) -> dict:
#     """Dependency to get current authenticated user (required)"""
#     if not credentials:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Authentication required",
#             headers={"WWW-Authenticate": "Bearer"}
#         )
    
#     return auth_service.verify_access_token(credentials.credentials)

# async def get_current_user_optional(
#     credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
# ) -> Optional[dict]:
#     """Dependency to get current user if authenticated (optional)"""
#     if not credentials:
#         return None
    
#     try:
#         return auth_service.verify_access_token(credentials.credentials)
#     except HTTPException:
#         return None

# def require_auth(func):
#     """Decorator for route handlers that require authentication"""
#     from functools import wraps
    
#     @wraps(func)
#     async def wrapper(*args, current_user: dict = Depends(get_current_user), **kwargs):
#         return await func(*args, current_user=current_user, **kwargs)
#     return wrapper

# app/auth/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.services.auth_service import auth_service

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Dependency to get the current authenticated user.
    Fails with 401 if authentication is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 🔑 This must accept your JWT structure (id, email, etc.)
    user = auth_service.verify_access_token(credentials.credentials)

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Dependency to get the current user if authenticated.
    Returns None if not authenticated or token is invalid.
    """
    if credentials is None:
        return None

    try:
        return auth_service.verify_access_token(credentials.credentials)
    except HTTPException:
        return None
