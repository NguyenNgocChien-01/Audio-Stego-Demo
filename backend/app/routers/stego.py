import os
import uuid
import shutil
import base64
import math
import tempfile
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.config import ALGORITHMS, PAYLOADS
from app.src.traditional import randomlsb, lsb, phase

router = APIRouter(
    prefix="/stego",
    tags=["Steganography Operations"]
)


def get_vn_timestamp():
    vn_tz = timezone(timedelta(hours=7))
    return datetime.now(vn_tz).strftime("%Y%m%d_%H%M%S")

def sanitize_float(value):
    if value is None or math.isinf(value) or math.isnan(value):
        return 0.0  
    return round(value, 2)

def get_algo_from_list(algo_id: int):


    algo = next((a for a in ALGORITHMS if a["algo_id"] == algo_id), None)

    if not algo or not algo["is_active"]:

        raise HTTPException(status_code=400, detail="Thuật toán không tồn tại hoặc bị khóa.")

    return algo
@router.get("/config")
async def get_config():
    return {
        "algorithms": ALGORITHMS,
        "payload_types": PAYLOADS
    }

@router.post("/encode")
async def api_encode(
    background_tasks: BackgroundTasks,
    algo_id: int = Form(...),
    audio: UploadFile = File(...),
    secret_text: str = Form(None),
    secret_file: UploadFile = File(None),
    password: str = Form(None)
):
    if not secret_text and not secret_file:
        raise HTTPException(status_code=400, detail="Cần cung cấp dữ liệu bí mật.")

    algo = get_algo_from_list(algo_id)
    normalized_name = algo["algo_name"].strip().lower()

    # Tạo tệp tạm thời cho đầu vào và đầu ra
    temp_dir = tempfile.gettempdir()
    unique_id = str(uuid.uuid4())[:8]
    
    input_path = os.path.join(temp_dir, f"in_{unique_id}_{audio.filename}")
    output_path = os.path.join(temp_dir, f"stego_{unique_id}.wav")
    sec_path = None

    try:
        # Lưu cover audio vào RAM/Disk tạm
        with open(input_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)

        if secret_file:
            sec_path = os.path.join(temp_dir, f"sec_{unique_id}_{secret_file.filename}")
            with open(sec_path, "wb") as f:
                shutil.copyfileobj(secret_file.file, f)
            secret_input = sec_path
        else:
            secret_input = secret_text

        # Điều hướng thuật toán
        if normalized_name == 'lsb':
            result = lsb.encode(input_path, secret_input, output_path)
        elif normalized_name in ['randomlsb', 'random lsb']:
            result = randomlsb.encode(input_path, secret_input, output_path, password)
        elif normalized_name in ['phase coding', 'phase']:
            result = phase.encode(input_path, secret_input, output_path)
        else:
            raise HTTPException(status_code=400, detail="Thuật toán không được hỗ trợ.")

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        # Thiết lập xóa toàn bộ file sau khi gửi trả kết quả
        background_tasks.add_task(os.remove, input_path)
        background_tasks.add_task(os.remove, output_path)
        if sec_path: background_tasks.add_task(os.remove, sec_path)

        k_value = result.get('k') or result.get('capacity') or 0

        headers = {
            "Metrics-MSE": str(sanitize_float(result.get('mse'))),
            "Metrics-PSNR": str(sanitize_float(result.get('psnr'))),
            "Metrics-SNR": str(sanitize_float(result.get('snr'))),
            "Metrics-K": str(k_value), # Thêm dòng này
            "Algo-Name": algo["algo_name"],
            "Access-Control-Expose-Headers": "Metrics-MSE, Metrics-PSNR, Metrics-SNR, Metrics-K, Algo-Name"
        }

        return FileResponse(
            path=output_path,
            filename=f"stego_{audio.filename}",
            media_type="audio/wav",
            headers=headers
        )

    except Exception as e:
        if os.path.exists(input_path): os.remove(input_path)
        if sec_path and os.path.exists(sec_path): os.remove(sec_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/decode")
async def api_decode(
    background_tasks: BackgroundTasks,
    algo_id: int = Form(...),
    stego_audio: UploadFile = File(...),
    password: str = Form(None)
):
    algo = get_algo_from_list(algo_id)
    normalized_name = algo["algo_name"].strip().lower()

    temp_dir = tempfile.gettempdir()
    unique_id = str(uuid.uuid4())[:8]
    decode_path = os.path.join(temp_dir, f"dec_{unique_id}.wav")

    try:
        with open(decode_path, "wb") as f:
            shutil.copyfileobj(stego_audio.file, f)

        if normalized_name == 'lsb':
            result = lsb.decode(decode_path)
        elif normalized_name in ['randomlsb', 'random lsb']:
            result = randomlsb.decode(decode_path, password)
        elif normalized_name in ['phase coding', 'phase']:
            result = phase.decode(decode_path)
        else:
            raise HTTPException(status_code=400, detail="Thuật toán không được hỗ trợ.")

        # Xóa file sau khi giải mã xong
        background_tasks.add_task(os.remove, decode_path)

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        # Xử lý dữ liệu trả về (Text hoặc Base64 cho file)
        response_data = {"status": "success", "algo_name": algo["algo_name"]}
        
        if 'content_text' in result:
            response_data.update({"payload_type": "text", "data": result['content_text']})
        elif 'data' in result:
            raw_data = result['data']
            if isinstance(raw_data, bytes):
                try:
                    response_data.update({"payload_type": "text", "data": raw_data.decode('utf-8')})
                except UnicodeDecodeError:
                    # Detect loại payload từ magic bytes
                    payload_type = "file"
                    if raw_data.startswith(b'RIFF') and b'WAVE' in raw_data[:12]:
                        payload_type = "audio"
                    elif raw_data.startswith(b'\x1a\x45\xdf\xa3'):  # WebM/Matroska
                        payload_type = "audio"
                    elif raw_data.startswith(b'ID3') or raw_data.startswith(b'\xff\xfb') or raw_data.startswith(b'\xff\xfa'):  # MP3
                        payload_type = "audio"
                    elif raw_data.startswith(b'fLaC'):  # FLAC
                        payload_type = "audio"
                    elif raw_data.startswith(b'OggS'):  # OGG
                        payload_type = "audio"
                    elif raw_data.startswith(b'\xff\xd8\xff'):  # JPEG
                        payload_type = "image"
                    elif raw_data.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
                        payload_type = "image"
                    elif raw_data.startswith(b'BM'):  # BMP
                        payload_type = "image"
                    elif raw_data.startswith(b'PK\x03\x04'):  # ZIP
                        payload_type = "file"
                    
                    response_data.update({
                        "payload_type": payload_type, 
                        "data": base64.b64encode(raw_data).decode('utf-8'),
                        "message": f"Dữ liệu {payload_type}" if payload_type != "file" else "Dữ liệu nhị phân (Binary)"
                    })
            else:
                response_data.update({"payload_type": "file", "data": raw_data})
        
        return response_data

    except Exception as e:
        if os.path.exists(decode_path): os.remove(decode_path)
        raise HTTPException(status_code=500, detail=str(e))