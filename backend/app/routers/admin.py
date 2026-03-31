# file: app/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from app.db.database import get_db
from app.db import models
from app import schemas

router = APIRouter(prefix="/admin", tags=["Admin Algorithms"])

# --- CATEGORY ALGORITHM ROUTES ---

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Cateogry_Algorithm).all()

@router.post("/categories", response_model=schemas.CategoryResponse)
def create_category(cat: schemas.CategoryCreate, db: Session = Depends(get_db)):
    new_cat = models.Cateogry_Algorithm(category_name=cat.category_name)
    db.add(new_cat)
    try:
        db.commit()
        db.refresh(new_cat)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Danh mục đã tồn tại")
    return new_cat

@router.put("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, cat_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Cateogry_Algorithm).filter(models.Cateogry_Algorithm.category_id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    
    db_cat.category_name = cat_update.category_name
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.Cateogry_Algorithm).filter(models.Cateogry_Algorithm.category_id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    
    # Kiểm tra xem có thuật toán nào đang sử dụng danh mục này không
    linked_algos = db.query(models.Algorithm).filter(models.Algorithm.category_id == category_id).first()
    if linked_algos:
        raise HTTPException(status_code=400, detail="Không thể xóa danh mục đang có thuật toán sử dụng")

    db.delete(db_cat)
    db.commit()
    return {"message": "Đã xóa danh mục thành công"}


# --- ALGORITHM ROUTES ---

@router.get("/algorithms", response_model=List[schemas.AlgorithmResponse])
def get_algorithms(db: Session = Depends(get_db)):
    return db.query(models.Algorithm).order_by(models.Algorithm.algo_id.desc()).all()

@router.post("/algorithms", response_model=schemas.AlgorithmResponse)
def create_algorithm(algo: schemas.AlgorithmCreate, db: Session = Depends(get_db)):
    new_algo = models.Algorithm(**algo.model_dump())
    db.add(new_algo)
    db.commit()
    db.refresh(new_algo)
    return new_algo

@router.put("/algorithms/{algo_id}", response_model=schemas.AlgorithmResponse)
def update_algorithm(algo_id: int, algo_update: schemas.AlgorithmCreate, db: Session = Depends(get_db)):
    db_algo = db.query(models.Algorithm).filter(models.Algorithm.algo_id == algo_id).first()
    if not db_algo:
        raise HTTPException(status_code=404, detail="Không tìm thấy thuật toán")
    
    # Cập nhật theo các trường trong Model mới của bạn
    db_algo.algo_name = algo_update.algo_name
    db_algo.category_id = algo_update.category_id # Sửa từ .category thành .category_id
    db_algo.is_active = algo_update.is_active
    
    db.commit()
    db.refresh(db_algo)
    return db_algo

@router.delete("/algorithms/{algo_id}")
def delete_algorithm(algo_id: int, db: Session = Depends(get_db)):
    db_algo = db.query(models.Algorithm).filter(models.Algorithm.algo_id == algo_id).first()
    if not db_algo:
        raise HTTPException(status_code=404, detail="Không tìm thấy thuật toán")
    
    db.delete(db_algo)
    db.commit()
    return {"message": "Đã xóa thành công"}

@router.post("/algorithms/upload_ai")
async def upload_ai_model(
    algo_name: str = Form(..., description="Tên mo hình AI "),
    model_file: UploadFile = File(..., description="File trọng số .pt"),
    db: Session = Depends(get_db)
):
    if not model_file.filename.endswith('.pt'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file định dạng .pt")

    # 1. Chuẩn hóa tên thuật toán (Ví dụ: " UNet v2 " -> "unet_v2")
    normalized_name = algo_name.strip().lower().replace(" ", "_")

    # 2. Tự động đổi tên file tải lên thành {normalized_name}.pt
    weights_dir = os.path.join(os.getcwd(), "weights")
    os.makedirs(weights_dir, exist_ok=True)
    
    file_path = os.path.join(weights_dir, f"{normalized_name}.pt")
    
    # Lưu đè nếu file đã tồn tại
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(model_file.file, buffer)

    # 3. Lưu vào Database (Giờ không cần cột model_file nữa)
    existing_algo = db.query(models.Algorithm).filter(models.Algorithm.algo_name == normalized_name).first()
    if existing_algo:
        db.commit()
        return {"message": f"Đã ghi đè file trọng số cho mô hình {normalized_name}.pt"}

    new_algo = models.Algorithm(
        algo_name=normalized_name,
        is_active=True
    )
    db.add(new_algo)
    db.commit()

    return {"message": f"Đã thêm mô hình AI {normalized_name} thành công!"}