import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

logger = logging.getLogger("haircraft")

# Initialize Firebase Admin SDK
firebase_initialized = False

def initialize_firebase():
    global firebase_initialized
    if firebase_initialized:
        return True
    
    if settings.MOCK_AUTH:
        logger.info("Firebase Auth is in MOCK mode. Admin SDK not initialized.")
        return False
        
    try:
        if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully with service account certificate.")
        else:
            # Fallback to default credentials or environment settings
            firebase_admin.initialize_app()
            logger.info("Firebase Admin SDK initialized with default credentials.")
        firebase_initialized = True
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to Mock Auth.")
        # Override mock auth to True to prevent backend crashes
        settings.MOCK_AUTH = True
        return False

# Setup Bearer token security scheme for routes
security_scheme = HTTPBearer(auto_error=False)

async def verify_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> dict:
    """
    FastAPI dependency to verify either customer or owner token.
    Returns the decoded token contents (including phone_number).
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials"
        )
    
    token = credentials.credentials
    
    # 1. Handle Mock Auth flow
    if settings.MOCK_AUTH:
        if token.startswith("mock-owner-token"):
            return {
                "phone_number": settings.OWNER_PHONE_NUMBER,
                "uid": "mock-owner-uid-999"
            }
        elif token.startswith("mock-customer-token"):
            # Mock token could look like mock-customer-token-+919876543210
            parts = token.split("-")
            phone = parts[-1] if len(parts) > 3 else "+919876543210"
            return {
                "phone_number": phone,
                "uid": "mock-customer-uid-111"
            }
        elif token == "mock-token":
            return {
                "phone_number": "+919876543210",
                "uid": "mock-customer-uid-111"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mock token format. Must start with 'mock-owner-token' or 'mock-customer-token'"
            )
            
    # 2. Real Firebase Token Verification
    initialize_firebase()
    try:
        decoded_token = auth.verify_id_token(token)
        phone_number = decoded_token.get("phone_number")
        if not phone_number:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a verified phone number"
            )
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )

async def verify_owner(token_payload: dict = Security(verify_token)) -> dict:
    """
    Dependency to restrict endpoint access to the Owner only.
    Checks if phone number matches settings.OWNER_PHONE_NUMBER.
    """
    phone_number = token_payload.get("phone_number")
    if phone_number != settings.OWNER_PHONE_NUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: authenticated user is not the salon owner"
        )
    return token_payload
