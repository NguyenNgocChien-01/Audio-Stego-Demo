import os
import traceback
import torch
import numpy as np
import soundfile as sf
import torch.nn.functional as F
from PIL import Image
from .umodel import StegoUNet
from .loader import ImageProcessor
from torch_stft import STFT
import warnings

warnings.filterwarnings("ignore")
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODELS_CACHE = {}

def get_model(algo_name): 
    global MODELS_CACHE
    if algo_name in MODELS_CACHE: 
        print(f"Model '{algo_name}' loaded from cache.")
        return MODELS_CACHE[algo_name]
    
    print(f"Loading model '{algo_name}' from weights...")
    weight_path = os.path.join(os.getcwd(), "weights", f"{algo_name}.pt")
    checkpoint = torch.load(weight_path, map_location=DEVICE)
    state_dict = checkpoint.get('state_dict', checkpoint)
    
    model = StegoUNet(transform='fourier', stft_small=False, ft_container='mag', embed='ws_replicate', luma=True)
    model.load_state_dict({k.replace('module.', ''): v for k, v in state_dict.items()}, strict=False)
    model.to(DEVICE).eval()
    
    stft = STFT(filter_length=4095, hop_length=66, win_length=4095).to(DEVICE)
    stft.num_samples = 67522
    
    MODELS_CACHE[algo_name] = (model, stft)
    print(f"Model '{algo_name}' loaded successfully.")
    return model, stft

def encode(cover_path, secret_input, output_path, **kwargs):
    try:
        print("Starting encoding process...")
        algo_name = kwargs.get("algo_name", "unet")
        print(f"Using algorithm: {algo_name}")
        model, stft_transform = get_model(algo_name)
        
        print("Processing secret image...")
        img_processor = ImageProcessor(image_path=secret_input)
        img_array = img_processor.forward() 
        secrets_rgb = torch.from_numpy(img_array).permute(2, 0, 1).unsqueeze(0).type(torch.FloatTensor).to(DEVICE)

        print("Loading cover audio...")
        data, samplerate = sf.read(cover_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        CHUNK_SIZE = 67522
        actual_len = min(len(data), CHUNK_SIZE)
        sound = torch.zeros(CHUNK_SIZE)
        sound[:actual_len] = torch.from_numpy(data[:actual_len])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        print("Performing STFT transform...")
        mag, phase = stft_transform.transform(sound) 
        
        covers = mag[:, :2048, :1024].unsqueeze(1) 
        
        print("Running model inference...")
        with torch.no_grad():
            # secrets_rgb là 3 kênh, vào trong model sẽ tự thêm kênh luma thứ 4
            containers, revealed_internal = model(secrets_rgb, covers)

        print("Reconstructing audio...")
        mag_patched = mag.clone()
        mag_patched[:, :2048, :1024] = containers.squeeze(1)

        container_wav = stft_transform.inverse(mag_patched, phase).cpu().numpy()[0]
        
        final_audio = np.copy(data)
        final_audio[:actual_len] = container_wav[:actual_len]

        print("Calculating metrics...")
        # --- TÍNH TOÁN METRICS (SNR & PSNR) ---
        # 1. Tính SNR cho Audio
        noise = data[:actual_len] - final_audio[:actual_len]
        signal_power = np.sum(data[:actual_len]**2)
        noise_power = np.sum(noise**2) + 1e-10
        real_snr = 10 * np.log10(signal_power / noise_power)

        # 2. Tính PSNR cho Image
        # revealed_internal từ RevealNet luôn trả về 3 kênh (RGB) sau narrow
        mse_img = F.mse_loss(secrets_rgb, revealed_internal).item()
        real_psnr = 20 * np.log10(1.0 / np.sqrt(mse_img + 1e-10))

        print("Saving output audio...")
        sf.write(output_path, np.clip(final_audio, -0.99, 0.99), samplerate, subtype='FLOAT')

        print("Encoding completed successfully.")
        return {
            "status": "success", 
            "output_path": output_path,
            "psnr": float(round(real_psnr, 2)),
            "snr": float(round(real_snr, 2)),
            "mse": float(mse_img),
            "capacity": 256 * 256 * 3
        }
    except Exception as e:
        print(f"Error during encoding: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def decode(stego_path, output_folder="outputs", **kwargs):
    try:
        algo_name = kwargs.get("algo_name", "unet")
        model, stft_transform = get_model(algo_name)

        print(f"Using algorithm: {algo_name}")
        
        # 1. Đọc và chuẩn hóa Audio
        data, _ = sf.read(stego_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        sound = torch.zeros(67522)
        sound[:min(len(data), 67522)] = torch.from_numpy(data[:min(len(data), 67522)])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        # 2. STFT
        mag, _ = stft_transform.transform(sound)
        containers = mag[:, :2048, :1024].unsqueeze(1) 

        # 3. Chạy Model giải mã
        with torch.no_grad():
            # 'revealed' là Tensor kết quả từ mạng Reveal Network
            revealed = model.RN(containers)

        # 4. CHUẨN BỊ ẢNH (Bắt đầu gán giá trị cho revealed_img)
        # Loại bỏ chiều Batch [1, C, H, W] -> [C, H, W]
        revealed_img = revealed.squeeze(0) 
        
        # Nếu model trả về 4 kênh (RGB+Luma), chỉ lấy 3 kênh đầu (RGB)
        if revealed_img.shape[0] == 4: 
            revealed_img = revealed_img[:3, :, :]
            
        # CHUYỂN ĐỔI SANG NUMPY (Lúc này revealed_img đã có giá trị nên sẽ không lỗi nữa)
        # Chuyển từ [C, H, W] thành [H, W, C] để xử lý ảnh
        revealed_img = revealed_img.permute(1, 2, 0).cpu().numpy()

        # 5. KHÔI PHỤC MÀU SẮC (Independent Normalization)
        # Tính Min/Max riêng cho từng kênh R, G, B
        rmin = revealed_img.min(axis=(0, 1))
        rmax = revealed_img.max(axis=(0, 1))

        # Chuẩn hóa độc lập từng kênh màu để tránh bị trắng đen
        norm_img = (revealed_img - rmin) / (rmax - rmin + 1e-9)
        revealed_img = np.clip(norm_img * 255.0, 0, 255).astype(np.uint8)
        
        # 6. Lưu ảnh kết quả
        os.makedirs(output_folder, exist_ok=True)
        output_image_path = os.path.join(output_folder, f"extracted_{algo_name}.png")
        Image.fromarray(revealed_img).save(output_image_path)

        return {
            "status": "success", 
            "type": "image", 
            "save_path": output_image_path
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}