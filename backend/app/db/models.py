from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base

def get_now():
    return datetime.now(timezone.utc)

# -------------------------------------------------------------------
# BẢNG TRUNG GIAN N-N (Algorithm - Payload)
# -------------------------------------------------------------------
algo_payload_association = Table(
    'algorithm_payloads', Base.metadata,
    Column('algo_id', Integer, ForeignKey('algorithms.algo_id', ondelete="CASCADE")),
    Column('payload_id', Integer, ForeignKey('payloads.payload_id', ondelete="CASCADE"))
)

# -------------------------------------------------------------------
# CÁC BẢNG DỮ LIỆU
# -------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=get_now)
    is_admin = Column(Boolean, default=False)
    transactions = relationship("StegoTransaction", back_populates="user")

class AudioFile(Base):
    __tablename__ = "audio_files"
    file_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    file_name = Column(String)
    file_path = Column(String)
    file_size_kb = Column(Integer)
    file_type = Column(String) # Cover / Stego

class Cateogry_Algorithm(Base):
    __tablename__ = "category_algorithms"
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, unique=True)

class Payload(Base):
    __tablename__ = "payloads"
    payload_id = Column(Integer, primary_key=True, index=True)
    payload_code = Column(String(20), unique=True, nullable=False) # 'text', 'image', 'audio', 'file'
    payload_name = Column(String(50), nullable=False)              # 'Văn bản', 'Hình ảnh'

class Algorithm(Base):
    __tablename__ = "algorithms"
    algo_id = Column(Integer, primary_key=True, index=True)
    algo_name = Column(String)
    category_id = Column(Integer, ForeignKey("category_algorithms.category_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    model_file = Column(String, nullable=True) 
    # requires_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_now)
    
    # Quan hệ N-N với bảng Payload
    supported_payloads = relationship("Payload", secondary=algo_payload_association)

class StegoTransaction(Base):
    __tablename__ = "stego_transactions"
    transaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True) 
    algo_id = Column(Integer, ForeignKey("algorithms.algo_id"), nullable=True)
    cover_file_id = Column(Integer, ForeignKey("audio_files.file_id"), nullable=True)
    stego_file_id = Column(Integer, ForeignKey("audio_files.file_id"), nullable=True)
    
    action_type = Column(String) # Encode / Decode
    payload_type = Column(String) # Text / File
    
    # Đã chuyển từ JSONB của Postgres sang JSON chung của SQLAlchemy
    algo_params = Column(JSON, nullable=True) 
    
    status = Column(String, default="Success")
    timestamp = Column(DateTime, default=get_now)

    user = relationship("User", back_populates="transactions")
    metrics = relationship("AudioMetric", back_populates="transaction", uselist=False)

class AudioMetric(Base):
    __tablename__ = "audio_metrics"
    transaction_id = Column(Integer, ForeignKey("stego_transactions.transaction_id"), primary_key=True)
    mse = Column(Float, nullable=True)
    snr = Column(Float, nullable=True)
    psnr = Column(Float, nullable=True)
    capacity_bytes = Column(Integer, nullable=True)
    transaction = relationship("StegoTransaction", back_populates="metrics")