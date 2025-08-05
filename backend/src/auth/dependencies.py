from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from auth.jwt_handler import jwt_handler
from auth.cognito import cognito_service

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt_handler.verify_token(token)
        
        if payload is None:
            raise credentials_exception
            
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
        # Extract Cognito token from JWT payload and verify with Cognito
        cognito_token = payload.get("cognito_token")
        if cognito_token is None:
            raise credentials_exception
            
        user_info = await cognito_service.get_user_info(cognito_token)
        if user_info is None:
            raise credentials_exception
            
        return user_info
        
    except Exception:
        raise credentials_exception

async def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = jwt_handler.verify_token(token)
        
        if payload is None:
            return None
            
        username: str = payload.get("sub")
        if username is None:
            return None
            
        cognito_token = payload.get("cognito_token")
        if cognito_token is None:
            return None
            
        user_info = await cognito_service.get_user_info(cognito_token)
        return user_info
        
    except Exception:
        return None