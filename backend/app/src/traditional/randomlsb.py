import os
import numpy as np
from scipy.io import wavfile
import hashlib
import io
import math

try:
    from PIL import Image
except ImportError:
    Image = None

class Stego:
    def __init__(self):
        self.ANCHOR_SIZE = 1024
        self.SENTINEL = b"||END||"

    def _generate_seed(self, password, salt):
        key = f"{password}__{salt}"
        return int(hashlib.sha256(key.encode()).hexdigest(), 16) % (2**32)

    def _get_content_salt(self, audio_data):
        anchor_data = audio_data[:self.ANCHOR_SIZE].tobytes()
        return hashlib.sha256(anchor_data).hexdigest()

    def calculate_metrics(self, original, stego):
            orig = original.astype(np.float64)
            mod = stego.astype(np.float64)
            diff = orig - mod
            mse = np.mean(diff ** 2)
            
            # Nếu MSE bằng 0, PSNR và SNR về lý thuyết là vô cực.
            # Cần gán giá trị hữu hạn để JSON có thể mã hóa được.
            if mse == 0: 
                return 0.0, 100.0, 100.0
            
            psnr = 20 * np.log10(32767.0 / np.sqrt(mse))
            
            signal_power = np.sum(orig ** 2)
            noise_power = np.sum(diff ** 2)
            
            # Kiểm tra noise_power để tránh chia cho 0
            if noise_power == 0:
                snr = 100.0
            else:
                snr = 10 * np.log10(signal_power / noise_power)
                
            return mse, snr, psnr

    def encode(self, cover_path, secret_input, output_path, password=None):
        try:
            rate, audio_data = wavfile.read(cover_path)
            if audio_data.dtype != np.int16:
                audio_data = (audio_data * 32767).astype(np.int16)
            
            audio_flat = audio_data.flatten()
            stego_flat = audio_flat.copy()
            num_slots = len(audio_flat) - self.ANCHOR_SIZE

            if os.path.isfile(secret_input):
                with open(secret_input, 'rb') as f: 
                    raw_secret_bytes = f.read()
            else:
                raw_secret_bytes = secret_input.encode('utf-8')

            full_payload = raw_secret_bytes + self.SENTINEL
            payload_bits_needed = len(full_payload) * 8
            
            k = max(1, min(math.ceil(payload_bits_needed / num_slots), 6))

            if payload_bits_needed > num_slots * k:
                return {"status": "error", "message": "Dung lượng Audio không đủ chứa dữ liệu."}

            bits = np.unpackbits(np.frombuffer(full_payload, dtype=np.uint8))
            remainder = len(bits) % k
            if remainder != 0: 
                bits = np.append(bits, [0] * (k - remainder))
            
            powers = 1 << np.arange(k)[::-1]
            secret_values = bits.reshape(-1, k).dot(powers).astype(np.int16)

            salt = self._get_content_salt(audio_flat)
            seed = self._generate_seed(password if password else "default", salt)
            print(f"[ENCODE] Salt: {salt} | Seed: {seed}")
            rng = np.random.default_rng(seed)
            
            shuffled_indices = rng.permutation(np.arange(self.ANCHOR_SIZE, len(audio_flat)))
            target_indices = shuffled_indices[:len(secret_values)]

            mask = (1 << k) - 1
            stego_flat[target_indices] &= ~mask
            stego_flat[target_indices] |= secret_values

            stego_data = stego_flat.reshape(audio_data.shape)
            wavfile.write(output_path, rate, stego_data)
            
            mse, snr, psnr = self.calculate_metrics(audio_data, stego_data)
            
            # ==========================================
            # ĐÃ SỬA: Ép kiểu int() và float() ở đây
            # ==========================================
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
            stego_flat = stego_data.flatten()
            
            salt = self._get_content_salt(stego_flat)
            seed = self._generate_seed(password if password else "default", salt)
            print(f"[DECODE] Salt: {salt} | Seed: {seed}")
            rng = np.random.default_rng(seed)
            
            shuffled_indices = rng.permutation(np.arange(self.ANCHOR_SIZE, len(stego_flat)))

            for k_try in range(1, 7):
                mask = (1 << k_try) - 1
                extracted_values = (stego_flat[shuffled_indices] & mask).astype(np.uint8)
                bits_matrix = np.unpackbits(extracted_values[:, np.newaxis], axis=1)
                relevant_bits = bits_matrix[:, -k_try:][:, ::-1]  # Fix: reverse to get correct bit order
                all_bytes = np.packbits(relevant_bits.flatten()).tobytes()
                
                pos = all_bytes.find(self.SENTINEL)
                if pos != -1:
                    # ==========================================
                    # ĐÃ SỬA: Ép kiểu int() cho k_detected
                    # ==========================================
                    return {
                        "status": "success", 
                        "data": all_bytes[:pos], 
                        "k_detected": int(k_try)
                    }
            
            return {"status": "error", "message": "Không tìm thấy dữ liệu hoặc mật khẩu sai."}
        except Exception as e:
            return {"status": "error", "message": str(e)}


_stego_instance = Stego()


def encode(cover_path, secret_input, output_path, password=None, *args, **kwargs):
    # Nhận trực tiếp biến password
    return _stego_instance.encode(cover_path, secret_input, output_path, password=password)

def decode(stego_path, password=None, *args, **kwargs):
    # Nhận trực tiếp biến password thay vì nhầm nó với output_folder
    result = _stego_instance.decode(stego_path, password=password)
    return result