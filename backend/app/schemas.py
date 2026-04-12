# file: app/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# --- SCHEMAS CHO CẤU HÌNH HỆ THỐNG (STATIC) ---

class AlgorithmInfo(BaseModel):
    """Sử dụng để trả về danh sách thuật toán hỗ trợ từ config.py"""
    algo_id: int
    algo_name: str
    category: str  # Ví dụ: 'Audio', 'Image'
    is_active: bool

class PayloadTypeInfo(BaseModel):
    """Sử dụng để trả về các loại payload hỗ trợ"""
    payload_code: str
    payload_name: str

# --- SCHEMAS CHO KẾT QUẢ XỬ LÝ (METRICS) ---

class StegoMetrics(BaseModel):
    """Các chỉ số chất lượng sau khi thực hiện Steganography"""
    mse: Optional[float] = None
    snr: Optional[float] = None
    psnr: Optional[float] = None
    capacity_bytes: Optional[int] = None
    processing_time: Optional[float] = None # Thời gian xử lý (giây)

# --- SCHEMAS CHO RESPONSE API ---

class EncodeResponse(BaseModel):
    """Kết quả trả về sau khi Encode thành công (nếu không dùng FileResponse trực tiếp)"""
    status: str = "Success"
    message: str
    metrics: StegoMetrics
    
class DecodeResponse(BaseModel):
    """Kết quả trả về sau khi Decode thành công"""
    status: str = "Success"
    payload_type: str
    hidden_data: str # Nội dung văn bản hoặc link tải tệp giải mã tạm thời

# --- SCHEMAS CHO LỊCH SỬ TRÌNH DUYỆT (LOCALSTORAGE) ---

class LocalHistoryItem(BaseModel):
    """Cấu trúc để Frontend lưu vào LocalStorage"""
    file_name: str
    algo_name: str
    timestamp: str
    action_type: str # 'Encode' hoặc 'Decode'
    metrics: Optional[StegoMetrics] = None