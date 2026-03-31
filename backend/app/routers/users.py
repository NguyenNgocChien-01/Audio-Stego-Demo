# file: app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db import models
from app import schemas

router = APIRouter(prefix="/admin", tags=["Admin Users & Roles"])
# READ: Tìm kiếm theo tên & Lọc theo quyền Admin
@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Tìm kiếm theo username"),
    is_admin: Optional[bool] = Query(None, description="Lọc theo quyền (True=Admin, False=User)")
):
    query = db.query(models.User)
    
    if search:
        query = query.filter(models.User.username.ilike(f"%{search}%"))
    if is_admin is not None:
        query = query.filter(models.User.is_admin == is_admin)
        
    return query.order_by(models.User.user_id.desc()).all()

# CREATE
@router.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    import hashlib
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    
    new_user = models.User(
        username=user.username,
        password_hash=hashed_pw,
        is_admin=user.is_admin # Lưu quyền
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username đã tồn tại")
    return new_user

# UPDATE
@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user_update: schemas.UserBase, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy User")
    
    db_user.username = user_update.username
    db_user.is_admin = user_update.is_admin # Cập nhật quyền
    db.commit()
    db.refresh(db_user)
    return db_user

# DELETE
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy User")
    db.delete(db_user)
    db.commit()
    return {"message": "Đã xóa thành công"}