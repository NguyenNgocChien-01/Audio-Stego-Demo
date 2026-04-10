import os
import uuid
import shutil
import base64
import math 
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import StegoTransaction, AudioMetric, Algorithm
from app.src.traditional import randomlsb 
# from app.src.dl_model import wrapper
from app.src.traditional import lsb, phase

router = APIRouter(
    prefix="/stego",
    tags=["Steganography Operations"]
)

UPLOAD_ROOT = os.path.join(os.getcwd(), "uploads")
STEGO_OUTPUT_DIR = os.path.join(UPLOAD_ROOT, "stego")
os.makedirs(STEGO_OUTPUT_DIR, exist_ok=True)

def get_vn_timestamp():
    vn_tz = timezone(timedelta(hours=7))
    return datetime.now(vn_tz).strftime("%Y%m%d_%H%M%S")

# =========================================
# HÀM XỬ LÝ LỖI SỐ THỰC (-inf, NaN) CHO JSON
# =========================================
def sanitize_float(value):
    if value is None:
        return None
    # Nếu là Infinity, -Infinity hoặc NaN, ép về 0.0 để JSON không bị sập
    if math.isinf(value) or math.isnan(value):
        return 0.0  
    return round(value, 2)

@router.post("/encode")
async def api_encode(
    algo_id: int = Form(...),
    audio: UploadFile = File(...),
    secret_text: str = Form(None),
    secret_file: UploadFile = File(None),
    password: str = Form(None),
    db: Session = Depends(get_db) 
):
    if not secret_text and not secret_file:
        raise HTTPException(status_code=400, detail="Cần cung cấp văn bản hoặc tệp tin để giấu.")

    algo_db = db.query(Algorithm).filter(Algorithm.algo_id == algo_id).first()
    if not algo_db or not algo_db.is_active:
        raise HTTPException(status_code=400, detail="Thuật toán không tồn tại hoặc đã bị khóa.")

    normalized_name = algo_db.algo_name.strip().lower() 

    timestamp = get_vn_timestamp()
    unique_id = str(uuid.uuid4())[:8]
    
    temp_audio_path = os.path.join(UPLOAD_ROOT, f"temp_{unique_id}_{audio.filename}")
    output_audio_name = f"stego_{timestamp}_{unique_id}.wav"
    output_audio_path = os.path.join(STEGO_OUTPUT_DIR, output_audio_name)
    
    temp_secret_path = None
    try:
        with open(temp_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        if secret_file:
            temp_secret_path = os.path.join(UPLOAD_ROOT, f"temp_sec_{unique_id}_{secret_file.filename}")
            with open(temp_secret_path, "wb") as buffer:
                shutil.copyfileobj(secret_file.file, buffer)
            secret_input = temp_secret_path
            payload_type = "file"
        else:
            secret_input = secret_text
            payload_type = "text"
        print(f" Password nhận được: {password}")
        
        if normalized_name == 'lsb':
            print("Nhúng bằng LSB")
            result = lsb.encode(temp_audio_path, secret_input, output_audio_path)
        elif normalized_name == 'randomlsb' or normalized_name == 'random lsb':
            print("Nhúng bằng Random LSB")
            result = randomlsb.encode(temp_audio_path, secret_input, output_audio_path, password)
        elif normalized_name == 'phase coding' or normalized_name == 'phase':
            print("Nhúng bằng Phase Coding")
            result = phase.encode(temp_audio_path, secret_input, output_audio_path)
        else:
            # Nếu KHÔNG PHẢI thuật toán cổ điển -> MẶC ĐỊNH ĐẨY XUỐNG AI XỬ LÝ
            # result = wrapper.encode(
            #     cover_path=temp_audio_path, 
            #     secret_input=secret_input, 
            #     output_path=output_audio_path, 
            #     algo_name=normalized_name
            # )
            print("Xuat Hien Loi")

        if os.path.exists(temp_audio_path): os.remove(temp_audio_path)
        if temp_secret_path and os.path.exists(temp_secret_path): os.remove(temp_secret_path)

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        # LƯU LỊCH SỬ VÀO DATABASE
        new_transaction = StegoTransaction(
            action_type="Encode", payload_type=payload_type, algo_id=algo_id,
            algo_params={"k": result.get('k')}, status="Success"
        )
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction) 

        new_metric = AudioMetric(
            transaction_id=new_transaction.transaction_id,
            mse=result.get('mse'), psnr=result.get('psnr'),
            snr=result.get('snr'), capacity_bytes=result.get('capacity')
        )
        db.add(new_metric)
        db.commit()

        # 🚀 ĐÃ FIX LỖI JSON TẠI ĐÂY: Sử dụng hàm sanitize_float để làm sạch dữ liệu
        return {
            "status": "success",
            "algo_name": algo_db.algo_name,
            "k_used": result.get('k'),
            "metrics": {
                "mse": sanitize_float(result.get('mse')), 
                "psnr": sanitize_float(result.get('psnr')), 
                "snr": sanitize_float(result.get('snr'))
            },
            "download_url": f"/static/stego/{output_audio_name}"
        }

    except HTTPException:
        if os.path.exists(temp_audio_path): os.remove(temp_audio_path)
        if temp_secret_path and os.path.exists(temp_secret_path): os.remove(temp_secret_path)
        raise
    except Exception as e:
        if os.path.exists(temp_audio_path): os.remove(temp_audio_path)
        if temp_secret_path and os.path.exists(temp_secret_path): os.remove(temp_secret_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decode")
async def api_decode(
    algo_id: int = Form(...),
    stego_audio: UploadFile = File(...),
    password: str = Form(None),
    db: Session = Depends(get_db) 
):
    algo_db = db.query(Algorithm).filter(Algorithm.algo_id == algo_id).first()
    if not algo_db or not algo_db.is_active:
        raise HTTPException(status_code=400, detail="Thuật toán không hợp lệ.")
    
    print(f" Password nhận được: {password}")
    normalized_name = algo_db.algo_name.strip().lower() 
    unique_id = str(uuid.uuid4())[:8]
    temp_decode_path = os.path.join(UPLOAD_ROOT, f"temp_dec_{unique_id}.wav")

    try:
        with open(temp_decode_path, "wb") as buffer:
            shutil.copyfileobj(stego_audio.file, buffer)

        #  ĐỊNH TUYẾN THÔNG MINH CHO DECODE
        if normalized_name == 'lsb':
            print("Giải mã bằng LSB")
            result = lsb.decode(temp_decode_path)
        elif normalized_name == 'randomlsb' or normalized_name == 'random lsb':
            print("Giải mã bằng Random LSB")
            result = randomlsb.decode(temp_decode_path, password)
        elif normalized_name == 'phase coding' or normalized_name == 'phase':
            print("Giải mã bằng Phase Coding")
            result = phase.decode(temp_decode_path)
        else:
            # # MẶC ĐỊNH LÀ MÔ HÌNH AI
            # result = wrapper.decode(
            #     stego_path=temp_decode_path, 
            #     output_folder=STEGO_OUTPUT_DIR, 
            #     algo_name=normalized_name
            # )
            print("Xuat Hien Loi")

        if os.path.exists(temp_decode_path): os.remove(temp_decode_path)

        if result['status'] == 'error':
            db.add(StegoTransaction(action_type="Decode", algo_id=algo_id, status="Failed"))
            db.commit()
            raise HTTPException(status_code=400, detail=result['message'])

        payload_type_value = result.get('payload_type')
        if not payload_type_value:
            payload_type_value = "text" if 'content_text' in result or 'data' in result else "file"

        success_transaction = StegoTransaction(
            action_type="Decode",
            payload_type=payload_type_value,
            algo_id=algo_id,
            status="Success",
            algo_params={"k_detected": result.get('k_detected')}
        )
        db.add(success_transaction)
        db.commit()

# CHUẨN HÓA KẾT QUẢ TRẢ VỀ
        if 'content_text' in result:
            return {"status": "success", "payload_type": "text", "data": result['content_text']}
            
        elif 'data' in result:
            raw_data = result['data']
            
            # 1. Nếu data đã là chuỗi (str) - do thuật toán RandomLSB trả về Base64
            if isinstance(raw_data, str):
                return {
                    "status": "success", 
                    "k_detected": result.get('k_detected'), 
                    "payload_type": result.get('type', 'file'), # Ưu tiên type do thuật toán trả về, nếu không có thì mặc định là file
                    "data": raw_data
                }
                
            # 2. Nếu data là bytes thuần (do thuật toán LSB/Phase cũ trả về)
            elif isinstance(raw_data, bytes):
                try:
                    # Cố gắng giải mã thành văn bản
                    return {
                        "status": "success", 
                        "k_detected": result.get('k_detected'), 
                        "payload_type": "text", 
                        "data": raw_data.decode('utf-8')
                    }
                except UnicodeDecodeError:
                    # Nếu là file nhị phân (hình ảnh, zip...), chuyển sang Base64
                    encoded_str = base64.b64encode(raw_data).decode('utf-8')
                    return {
                        "status": "success", 
                        "k_detected": result.get('k_detected'), 
                        "payload_type": "file", 
                        "data": encoded_str, 
                        "message": "Binary data detected"
                    }
        
        # ĐÃ SỬA: Chuyển ảnh AI thành Base64 thay vì FileResponse
        elif 'save_path' in result:
             with open(result['save_path'], "rb") as f:
                 file_data = f.read()
             encoded_string = base64.b64encode(file_data).decode('utf-8')
             
             return {
                 "status": "success",
                 "payload_type": "file",
                 "data": encoded_string,
                 "message": "Dữ liệu nhị phân được trích xuất thành công!"
             }
    except HTTPException:
        if os.path.exists(temp_decode_path): os.remove(temp_decode_path)
        raise
    except Exception as e:
        if os.path.exists(temp_decode_path): os.remove(temp_decode_path)
        raise HTTPException(status_code=500, detail=str(e))