
import os
import jwt
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status
from typing import Dict
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
        self.jwt_algorithm = "HS256"
        self.token_expire_hours = 24

        if not self.google_client_id:
            logger.warning("GOOGLE_CLIENT_ID not configured")

    # ---------------------------
    # Google OAuth verification
    # ---------------------------
    def verify_google_token(self, token: str) -> Dict:
        try:
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), self.google_client_id
            )

            if idinfo["iss"] not in (
                "accounts.google.com",
                "https://accounts.google.com",
            ):
                raise ValueError("Invalid token issuer")

            return {
                "id": idinfo["sub"],
                "email": idinfo["email"],
                "name": idinfo["name"],
                "picture": idinfo.get("picture", ""),
                "verified_email": idinfo.get("email_verified", False),
            }

        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )

    # ---------------------------
    # JWT creation
    # ---------------------------
    def create_access_token(self, user_data: Dict) -> str:
        try:
            expire = datetime.utcnow() + timedelta(hours=self.token_expire_hours)

            payload = {
                "id": user_data["id"],            # 🔑 explicit
                "email": user_data["email"],
                "name": user_data.get("name"),
                "picture": user_data.get("picture"),
                "verified_email": user_data.get("verified_email", False),
                "type": "access_token",
                "iat": datetime.utcnow(),
                "exp": expire,
            }

            token = jwt.encode(
                payload,
                self.jwt_secret,
                algorithm=self.jwt_algorithm,
            )

            return token if isinstance(token, str) else token.decode("utf-8")

        except Exception as e:
            logger.error(f"Token creation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create access token",
            )

    # ---------------------------
    # JWT verification (FIXED)
    # ---------------------------
    def verify_access_token(self, token: str) -> Dict:
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm],
                options={"verify_aud": False},
            )

            # 🔑 REQUIRED CLAIM VALIDATION
            if payload.get("type") != "access_token":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )

            if not payload.get("id"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload (missing user id)",
                )

            if not payload.get("email"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload (missing email)",
                )

            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )


# Global instance
auth_service = AuthService()
