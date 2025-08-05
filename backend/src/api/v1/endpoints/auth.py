from fastapi import APIRouter, HTTPException, status, Depends
from api.v1.schemas.auth import LoginRequest, LoginResponse, UserInfo
from auth.cognito import cognito_service
from auth.jwt_handler import jwt_handler
from auth.dependencies import get_current_user

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Authenticate with Cognito
    auth_result = await cognito_service.authenticate_user(
        request.username, 
        request.password
    )
    
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Get user info
    user_info = await cognito_service.get_user_info(auth_result['access_token'])
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not retrieve user information"
        )
    
    # Create internal JWT token
    token_data = {
        "sub": user_info['username'],
        "email": user_info['attributes'].get('email', ''),
        "cognito_token": auth_result['access_token']
    }
    
    internal_token = jwt_handler.create_access_token(token_data)
    
    return LoginResponse(
        access_token=internal_token,
        token_type="bearer",
        user_info=user_info
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserInfo(
        username=current_user['username'],
        email=current_user['attributes'].get('email'),
        attributes=current_user['attributes']
    )