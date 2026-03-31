import os
import numpy as np
from scipy.io import wavfile

def _get_data_bytes(secret_input):
    if os.path.isfile(secret_input):
        with open(secret_input, 'rb') as f: return f.read()
    return secret_input.encode('utf-8')

def _bytes_to_bitstream(data_bytes):
    binary_data = ''.join(format(byte, '08b') for byte in data_bytes)
    delimiter_binary = ''.join(format(byte, '08b') for byte in b"||DATA_END||")
    return binary_data + delimiter_binary

def calculate_metrics(original, stego):
    orig = original.astype(np.float64)
    mod = stego.astype(np.float64)
    diff = orig - mod
    mse = np.mean(diff ** 2)
    
    if mse == 0: return 0.0, 100.0, 100.0
    
    psnr = 20 * np.log10(32767.0 / np.sqrt(mse))
    signal_power = np.sum(orig ** 2)
    noise_power = np.sum(diff ** 2)
    snr = 100.0 if noise_power == 0 else 10 * np.log10(signal_power / noise_power)
    
    return float(mse), float(psnr), float(snr)

def encode(cover_path, secret_input, output_path, **kwargs):
    try:
        sample_rate, audio_data = wavfile.read(cover_path)
        original_shape = audio_data.shape
        
        # Ép kiểu an toàn
        if audio_data.dtype != np.int16:
            if np.issubdtype(audio_data.dtype, np.floating):
                audio_data = (audio_data * 32767).astype(np.int16)
            else:
                audio_data = audio_data.astype(np.int16)

        stego_data_flat = audio_data.flatten()
        data_bytes = _get_data_bytes(secret_input)
        bitstream = _bytes_to_bitstream(data_bytes)
        data_length = len(bitstream)
        
        if data_length > len(stego_data_flat):
            raise ValueError("Dung lượng Audio không đủ chứa dữ liệu.")
            
        bits_array = np.array([int(b) for b in bitstream], dtype=np.int16)
        
        # Dùng toán tử & -2 thay cho ~1 để ép bit 0 an toàn nhất
        stego_data_flat[:data_length] &= -2
        stego_data_flat[:data_length] |= bits_array
            
        stego_data = stego_data_flat.reshape(original_shape)
        wavfile.write(output_path, sample_rate, stego_data)
        
        mse, psnr, snr = calculate_metrics(audio_data, stego_data)
        
        return {
            "status": "success",
            "output_path": output_path,
            "mse": mse,
            "psnr": psnr,
            "snr": snr,
            "capacity": len(stego_data_flat) // 8
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def decode(stego_path, output_folder="outputs", **kwargs):
    try:
        _, stego_data = wavfile.read(stego_path)
        
        if stego_data.dtype != np.int16:
             if np.issubdtype(stego_data.dtype, np.floating):
                 stego_data = (stego_data * 32767).astype(np.int16)
             else:
                 stego_data = stego_data.astype(np.int16)
        
        lsb_bits = stego_data.flatten() & 1
        all_bytes = np.packbits(lsb_bits).tobytes()
        
        end_idx = all_bytes.find(b"||DATA_END||")
        if end_idx == -1:
            return {'status': 'error', 'message': "Không tìm thấy chuỗi kết thúc (File sạch hoặc lỗi)."}
            
        content = all_bytes[:end_idx]
        
        try:
            text_content = content.decode('utf-8')
            return {'status': 'success', 'type': 'text', 'content_text': text_content}
        except UnicodeDecodeError:
            os.makedirs(output_folder, exist_ok=True)
            save_path = os.path.join(output_folder, "extracted_lsb.bin")
            with open(save_path, 'wb') as f: f.write(content)
            return {'status': 'success', 'type': 'binary', 'save_path': save_path}
            
    except Exception as e:
        return {'status': 'error', 'message': str(e)}