import os
import numpy as np
from scipy.io import wavfile
import hashlib
import math
import base64

class Stego:
    def __init__(self):
        self.ANCHOR_SIZE = 1024
        self.SENTINEL = b"||END||"

    def _generate_seed(self, password, salt):
        # Chuẩn hóa mật khẩu, loại bỏ khoảng trắng ẩn
        if password is not None:
            password = str(password).strip()
        else:
            password = "default"
            
        key = f"{password}__{salt}"
        return int(hashlib.sha256(key.encode()).hexdigest(), 16) % (2**32)

    def _get_content_salt(self, audio_data):
        # Đảm bảo vùng Anchor luôn là int16 trước khi băm
        anchor_data = audio_data[:self.ANCHOR_SIZE].astype(np.int16).tobytes()
        return hashlib.sha256(anchor_data).hexdigest()

    def calculate_metrics(self, original, stego):
        orig = original.astype(np.float64)
        mod = stego.astype(np.float64)
        diff = orig - mod
        mse = np.mean(diff ** 2)
        
        if mse == 0: 
            return 0.0, 100.0, 100.0
        
        psnr = 20 * np.log10(32767.0 / np.sqrt(mse))
        
        signal_power = np.sum(orig ** 2)
        noise_power = np.sum(diff ** 2)
        
        if noise_power == 0:
            snr = 100.0
        else:
            snr = 10 * np.log10(signal_power / noise_power)
            
        return float(mse), float(snr), float(psnr)

    def encode(self, cover_path, secret_input, output_path, password=None):
        try:
            rate, audio_data = wavfile.read(cover_path)
            
            # Ép kiểu an toàn về int16 (16-bit PCM Audio)
            if audio_data.dtype != np.int16:
                if audio_data.dtype in [np.float32, np.float64]:
                    audio_data = (audio_data * 32767).astype(np.int16)
                else:
                    audio_data = audio_data.astype(np.int16)

            audio_flat = audio_data.flatten()
            stego_flat = audio_flat.copy()
            num_slots = len(audio_flat) - self.ANCHOR_SIZE

            # Xác định tải tin là File hay Chuỗi
            if isinstance(secret_input, str) and os.path.isfile(secret_input) and len(secret_input) < 2048:
                with open(secret_input, 'rb') as f: 
                    raw_secret_bytes = f.read()
            elif isinstance(secret_input, bytes):
                raw_secret_bytes = secret_input
            else:
                raw_secret_bytes = str(secret_input).encode('utf-8')

            full_payload = raw_secret_bytes + self.SENTINEL
            payload_bits_needed = len(full_payload) * 8
            
            # Tính toán k tối ưu
            k = max(1, min(math.ceil(payload_bits_needed / num_slots), 6))

            if payload_bits_needed > num_slots * k:
                return {"status": "error", "message": f"Dung lượng Audio không đủ chứa dữ liệu (Yêu cầu: {payload_bits_needed} bits)."}

            # Chuyển payload thành mảng bit và padding cho tròn k
            bits = np.unpackbits(np.frombuffer(full_payload, dtype=np.uint8))
            remainder = len(bits) % k
            if remainder != 0: 
                bits = np.append(bits, [0] * (k - remainder))
            
            # Tính toán giá trị k-bit để thay thế
            powers = 1 << np.arange(k)[::-1]
            secret_values = bits.reshape(-1, k).dot(powers).astype(np.int16)

            # Tính toán lộ trình nhúng ngẫu nhiên
            salt = self._get_content_salt(audio_flat)
            seed = self._generate_seed(password, salt)
            print(f"[ENCODE] Salt: {salt} | Seed: {seed} | LSB Used (k): {k}")
            
            rng = np.random.default_rng(seed)
            available_indices = np.arange(self.ANCHOR_SIZE, len(audio_flat))
            shuffled_indices = rng.permutation(available_indices)
            target_indices = shuffled_indices[:len(secret_values)]

            # Can thiệp trực tiếp vào mảng bit bằng mask an toàn
            mask = np.int16((1 << k) - 1)
            inv_mask = np.int16(~mask)
            
            stego_flat[target_indices] &= inv_mask
            stego_flat[target_indices] |= secret_values

            # Tái cấu trúc và ghi ra file WAV
            stego_data = stego_flat.reshape(audio_data.shape)
            wavfile.write(output_path, rate, stego_data)
            
            mse, snr, psnr = self.calculate_metrics(audio_data, stego_data)
            
            return {
                "status": "success", 
                "k": int(k), 
                "mse": float(mse), 
                "snr": float(snr), 
                "psnr": float(psnr)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def decode(self, stego_path, password=None):
        try:
            rate, stego_data = wavfile.read(stego_path)
            
            # Ép kiểu tương tự khi encode
            if stego_data.dtype != np.int16:
                if stego_data.dtype in [np.float32, np.float64]:
                    stego_data = (stego_data * 32767).astype(np.int16)
                else:
                    stego_data = stego_data.astype(np.int16)

            stego_flat = stego_data.flatten()
            
            salt = self._get_content_salt(stego_flat)
            seed = self._generate_seed(password, salt)
            print(f"[DECODE] Salt: {salt} | Seed: {seed}")
            
            rng = np.random.default_rng(seed)
            available_indices = np.arange(self.ANCHOR_SIZE, len(stego_flat))
            shuffled_indices = rng.permutation(available_indices)

            # Giải mã mù tự động quét tìm k
            for k_try in range(1, 7):
                mask = (1 << k_try) - 1
                
                # Trích xuất k bit cuối
                extracted_values = np.bitwise_and(stego_flat[shuffled_indices], mask).astype(np.uint8)
                
                # Khai triển bit và ghép lại byte
                bits_matrix = np.unpackbits(extracted_values[:, np.newaxis], axis=1)
                relevant_bits = bits_matrix[:, -k_try:]
                all_bytes = np.packbits(relevant_bits.flatten()).tobytes()
                
                pos = all_bytes.find(self.SENTINEL)
                if pos != -1:
                    extracted_data = all_bytes[:pos]
                    
                    # QUAN TRỌNG: Mã hóa Base64 trước khi trả về để tránh lỗi API JSON 
                    b64_data = base64.b64encode(extracted_data).decode('utf-8')
                    
                    return {
                        "status": "success", 
                        "data": b64_data,
                        "type": "file",  # Gợi ý cho frontend nhận biết đây là dạng base64
                        "k_detected": int(k_try)
                    }
            
            return {"status": "error", "message": "Không tìm thấy chuỗi kết thúc (Sentinel) hoặc mật khẩu sai."}
        except Exception as e:
            return {"status": "error", "message": f"Lỗi nội bộ thuật toán: {str(e)}"}

# ----------------- KẾT NỐI API -----------------
_stego_instance = Stego()

def encode(cover_path, secret_input, output_path, password=None, *args, **kwargs):
    return _stego_instance.encode(cover_path, secret_input, output_path, password=password)

def decode(stego_path, password=None, *args, **kwargs):
    return _stego_instance.decode(stego_path, password=password)