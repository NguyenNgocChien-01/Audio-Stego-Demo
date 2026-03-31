# Thêm các thư viện này ở đầu file nếu chưa có
from sqlalchemy.orm import joinedload
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.database import get_db
from app.db import models
from app import schemas

router = APIRouter(prefix="/admin", tags=["Admin Transactions"])

@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    action_type: Optional[str] = Query(None, description="Lọc theo Encode hoặc Decode"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái (VD: Success)"),
    user_id: Optional[int] = Query(None, description="Lọc theo ID người dùng")
):
    # Dùng joinedload để lấy luôn dữ liệu các bảng liên kết (Tránh lỗi N+1 Query làm chậm DB)
    query = db.query(models.StegoTransaction).options(
        joinedload(models.StegoTransaction.user),
        joinedload(models.StegoTransaction.metrics)
        # Bỏ qua load thuật toán nếu bạn chưa set relationship trên model
    )

    # Lọc theo Action Type (Encode/Decode)
    if action_type:
        query = query.filter(models.StegoTransaction.action_type == action_type)
        
    # Lọc theo Status
    if status:
        query = query.filter(models.StegoTransaction.status == status)
        
    # Lọc theo User
    if user_id:
        query = query.filter(models.StegoTransaction.user_id == user_id)

    # Sắp xếp mới nhất lên đầu
    return query.order_by(models.StegoTransaction.transaction_id.desc()).all()

# XÓA TRANSACTION
@router.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    db_tx = db.query(models.StegoTransaction).filter(models.StegoTransaction.transaction_id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")
    
    # Xóa metrics liên quan trước (nếu có) do ràng buộc khóa ngoại
    db.query(models.AudioMetric).filter(models.AudioMetric.transaction_id == tx_id).delete()
    
    db.delete(db_tx)
    db.commit()
    return {"message": "Đã xóa giao dịch"}