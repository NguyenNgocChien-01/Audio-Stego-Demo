# file: app/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
# --- SCHEMAS CHO CATEGORY ---

class CategoryBase(BaseModel):
    category_name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True


# --- SCHEMAS CHO ALGORITHM ---

class AlgorithmBase(BaseModel):
    algo_name: str
    category_id: Optional[int] = None
    is_active: bool = True
    model_file: Optional[str] = None #

class AlgorithmCreate(AlgorithmBase):
    pass

class AlgorithmResponse(AlgorithmBase):
    algo_id: int

    class Config:
        from_attributes = True



class UserBase(BaseModel):
    username: str
    is_admin: bool = False

class UserCreate(UserBase):
    password: str  # Frontend gửi password gốc lên

class UserResponse(UserBase):
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS CHO AUDIO FILE ---
class AudioFileResponse(BaseModel):
    file_id: int
    file_name: str
    file_size_kb: Optional[int] = None
    file_type: str

    class Config:
        from_attributes = True

# --- SCHEMAS CHO AUDIO METRIC ---
class AudioMetricResponse(BaseModel):
    mse: Optional[float] = None
    snr: Optional[float] = None
    psnr: Optional[float] = None
    capacity_bytes: Optional[int] = None

    class Config:
        from_attributes = True

# --- SCHEMAS CHO TRANSACTION (Tổng hợp tất cả) ---
class TransactionResponse(BaseModel):
    transaction_id: int
    action_type: str
    payload_type: str
    status: str
    timestamp: datetime
    
    # Kiểu Dict cho JSONB (algo_params)
    algo_params: Optional[Dict[str, Any]] = None 
    
    # Nhúng các thông tin liên quan (Relationships)
    user: Optional[UserResponse] = None
    algorithm: Optional[AlgorithmResponse] = None # Giả sử bạn đã có AlgorithmResponse
    metrics: Optional[AudioMetricResponse] = None
    
    # Không cần lấy toàn bộ file, chỉ cần ID hoặc tên (Ở đây ta lấy ID cho nhẹ)
    cover_file_id: Optional[int] = None
    stego_file_id: Optional[int] = None

    class Config:
        from_attributes = True