from fastapi import APIRouter, HTTPException, Form, Header, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import secrets
import hashlib
from app.db.database import get_db
from app.db import models

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    is_active: bool

# Simple token storage (in production, use JWT signing)
token_map = {}  # token -> {user_id, username, is_admin}

@router.post("/login", response_model=LoginResponse)
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """
    Login endpoint - checks database for credentials
    Password is SHA256 hashed to match storage in DB
    """
    # Hash the provided password (same method as in /admin/users create)
    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    
    # Check database
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user or user.password_hash != hashed_pw:
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")
    
    # Generate tokens
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    
    # Store token info for /auth/me
    token_map[access_token] = {"user_id": user.user_id, "username": username, "is_admin": user.is_admin}
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
async def get_me(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Get current user info from token"""
    try:
        token = authorization.replace("Bearer ", "")
        token_info = token_map.get(token)
        
        if not token_info:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(models.User).filter(models.User.user_id == token_info["user_id"]).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return UserResponse(
            user_id=user.user_id,
            username=user.username,
            email=f"{user.username}@stego.local",
            role="admin" if user.is_admin else "user",
            is_active=True
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout")
async def logout(authorization: str = Header(...)):
    """Logout endpoint - revoke token"""
    try:
        token = authorization.replace("Bearer ", "")
        if token in token_map:
            del token_map[token]
        return {"message": "Logged out successfully"}
    except:
        return {"message": "Logout successful"}
