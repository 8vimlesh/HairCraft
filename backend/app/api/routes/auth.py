import logging
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.models.schemas import OwnerLoginRequest
from app.core.security import verify_token

router = APIRouter()
logger = logging.getLogger("haircraft")

@router.post("/owner/login")
async def owner_login(req: OwnerLoginRequest):
    """
    Validate owner login. Checks if the provided Firebase ID token 
    belongs to the owner phone number defined in settings.
    """
    # Manually verify the token passed in request body
    # We create a dummy HTTPAuthorizationCredentials wrapper to reuse the verify_token logic
    from fastapi.security import HTTPAuthorizationCredentials
    
    dummy_creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=req.id_token)
    try:
        token_payload = await verify_token(credentials=dummy_creds)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
        
    phone_number = token_payload.get("phone_number")
    if phone_number != settings.OWNER_PHONE_NUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: This phone number is not registered as the owner"
        )
        
    return {
        "status": "success",
        "message": "Authenticated as owner",
        "phone_number": phone_number,
        "token": req.id_token
    }
