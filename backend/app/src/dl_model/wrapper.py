import os
import sys
import traceback
import warnings

import torch
import numpy as np
import soundfile as sf
import torch.nn.functional as F
from PIL import Image

from .umodel import StegoUNet
from .loader import ImageProcessor
from torch_stft import STFT

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
    
    if not os.path.exists(weight_path):
        raise FileNotFoundError(f"Không tìm thấy file trọng số tại: {weight_path}")

    checkpoint = torch.load(weight_path, map_location=DEVICE)
    state_dict = checkpoint.get('state_dict', checkpoint)
    clean_sd = {k.replace('module.', ''): v for k, v in state_dict.items()}
    
    keys = clean_sd.keys()
    
    is_stft_small = True
    if any(k.startswith('encblocks.7') for k in keys):
        is_stft_small = False
        
    is_luma = False
    luma_key = 'PHN.im_encoder_layers.0.conv.conv1.0.weight'
    if luma_key in keys and clean_sd[luma_key].shape[1] == 4:
        is_luma = True

    embed_type = 'blocks'
    if not any('encblocks' in k for k in keys):
        embed_type = 'stretch'

    print(f"[*] Cấu hình AI: STFT_SMALL={is_stft_small}, LUMA={is_luma}, EMBED='{embed_type}'")
    
    model = StegoUNet(transform='fourier', stft_small=is_stft_small, ft_container='mag', embed=embed_type, luma=is_luma)
    model.load_state_dict(clean_sd, strict=False)
    model.to(DEVICE).eval()
    
    fl = 2047 if is_stft_small else 4095
    hl = 132 if is_stft_small else 66
    stft = STFT(filter_length=fl, hop_length=hl, win_length=fl, window='hann').to(DEVICE)
    stft.num_samples = 67522
    
    MODELS_CACHE[algo_name] = (model, stft)
    print(f"Model '{algo_name}' tải thành công.")
    return model, stft

def encode(cover_path, secret_input, output_path, *args, **kwargs):
    try:
        algo_name = kwargs.get("algo_name", "unet")
        print(f"\n[ENCODE] Bắt đầu xử lý học sâu (Deep Learning): {algo_name}")
        
        model, stft_transform = get_model(algo_name)
        
        print("Đang xử lý ảnh bí mật...")
        img_processor = ImageProcessor(image_path=secret_input)
        img_array = img_processor.forward() 
        secrets_rgb = torch.from_numpy(img_array).permute(2, 0, 1).unsqueeze(0).type(torch.FloatTensor).to(DEVICE)

        print("Đang tải âm thanh vỏ (cover)...")
        data, samplerate = sf.read(cover_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        CHUNK_SIZE = 67522
        actual_len = min(len(data), CHUNK_SIZE)
        sound = torch.zeros(CHUNK_SIZE)
        sound[:actual_len] = torch.from_numpy(data[:actual_len])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        print("Thực hiện STFT...")
        mag, phase_tensor = stft_transform.transform(sound) 
        
        f_dim = 1024 if stft_transform.filter_length == 2047 else 2048
        t_dim = 512 if stft_transform.filter_length == 2047 else 1024
        covers = mag[:, :f_dim, :t_dim].unsqueeze(1) 
        
        print("Đang chạy mạng Nơ-ron (Inference)...")
        with torch.no_grad():
            containers, revealed_internal = model(secrets_rgb, covers)

        print("Tái tạo âm thanh đầu ra...")
        mag_patched = mag.clone()
        mag_patched[:, :f_dim, :t_dim] = containers.squeeze(1)

        container_wav = stft_transform.inverse(mag_patched, phase_tensor).cpu().numpy()[0]
        
        final_audio = np.copy(data)
        final_audio[:actual_len] = container_wav[:actual_len]

        print("Tính toán các chỉ số (Metrics)...")
        noise = data[:actual_len] - final_audio[:actual_len]
        signal_power = np.sum(data[:actual_len]**2)
        noise_power = np.sum(noise**2) + 1e-10
        real_snr = 10 * np.log10(signal_power / noise_power)

        mse_img = F.mse_loss(secrets_rgb, revealed_internal).item()
        real_psnr = 20 * np.log10(1.0 / np.sqrt(mse_img + 1e-10))

        print("Đang lưu file audio Stego...")
        sf.write(output_path, np.clip(final_audio, -0.99, 0.99), samplerate, subtype='FLOAT')

        print("[ENCODE] Hoàn tất thành công.")
        return {
            "status": "success", 
            "output_path": output_path,
            "psnr": float(round(real_psnr, 2)),
            "snr": float(round(real_snr, 2)),
            "mse": float(mse_img),
            "capacity": 256 * 256 * 3
        }
    except Exception as e:
        print(f"Lỗi hệ thống: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def decode(stego_path, output_folder="outputs", *args, **kwargs):
    try:
        algo_name = kwargs.get("algo_name", "unet")
        print(f"\n[DECODE] Bắt đầu giải mã học sâu: {algo_name}")
        
        model, stft_transform = get_model(algo_name)
        
        data, _ = sf.read(stego_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        sound = torch.zeros(67522)
        sound[:min(len(data), 67522)] = torch.from_numpy(data[:min(len(data), 67522)])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        mag, _ = stft_transform.transform(sound)
        
        f_dim = 1024 if stft_transform.filter_length == 2047 else 2048
        t_dim = 512 if stft_transform.filter_length == 2047 else 1024
        containers = mag[:, :f_dim, :t_dim].unsqueeze(1) 

        print("Chạy mạng Reveal Network...")
        with torch.no_grad():
            revealed = model.RN(containers)

        revealed_img = revealed.squeeze(0) 
        if revealed_img.shape[0] == 4: 
            revealed_img = revealed_img[:3, :, :]
            
        revealed_img = revealed_img.permute(1, 2, 0).cpu().numpy()

        rmin = revealed_img.min(axis=(0, 1))
        rmax = revealed_img.max(axis=(0, 1))
        norm_img = (revealed_img - rmin) / (rmax - rmin + 1e-9)
        revealed_img = np.clip(norm_img * 255.0, 0, 255).astype(np.uint8)
        
        os.makedirs(output_folder, exist_ok=True)
        output_image_path = os.path.join(output_folder, f"extracted_{algo_name}.png")
        Image.fromarray(revealed_img).save(output_image_path)

        print("[DECODE] Trích xuất ảnh thành công.")
        return {
            "status": "success", 
            "type": "image", 
            "save_path": output_image_path
        }
    except Exception as e:
        print("Lỗi giải mã:")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}