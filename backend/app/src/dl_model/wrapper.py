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
        return MODELS_CACHE[algo_name]
    
    weight_path = os.path.join(os.getcwd(), "weights", f"{algo_name}.pt")
    if not os.path.exists(weight_path):
        raise FileNotFoundError(f"[ERROR] Không tìm thấy tệp trọng số: {weight_path}")

    checkpoint = torch.load(weight_path, map_location=DEVICE)
    state_dict = checkpoint.get('state_dict', checkpoint)
    clean_sd = {k.replace('module.', ''): v for k, v in state_dict.items()}
    
    # Cấu hình Hàng 29: stft_small=False, luma=True
    model = StegoUNet(
        transform='fourier', 
        stft_small=False, 
        ft_container='mag', 
        embed='ws_replicate', 
        luma=True
    )
    
    model.load_state_dict(clean_sd, strict=False)
    model.to(DEVICE).eval()
    
    # Thông số STFT cho STFT_SMALL=False
    fl = 4095 
    hl = 66
    stft = STFT(filter_length=fl, hop_length=hl, win_length=fl, window='hann').to(DEVICE)
    stft.num_samples = 67522
    
    MODELS_CACHE[algo_name] = (model, stft)
    print(f"[INIT] Đã tải mô hình HÀNG 29: {algo_name.upper()} | STFT_SMALL: False | LUMA: True")
    return model, stft

def encode(cover_path, secret_input, output_path, **kwargs):
    try:
        algo_name = kwargs.get("algo_name", "unet")
        model, stft_transform = get_model(algo_name)
        
        img_processor = ImageProcessor(image_path=secret_input)
        img_array = img_processor.forward() 
        secrets = torch.from_numpy(img_array).permute(2, 0, 1).unsqueeze(0).type(torch.FloatTensor).to(DEVICE)

        data, samplerate = sf.read(cover_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        full_audio_length = len(data)
        final_stego_audio = np.copy(data)
        CHUNK_SIZE = 67522 
        
        actual_len = min(full_audio_length, CHUNK_SIZE)
        sound = torch.zeros(CHUNK_SIZE)
        sound[:actual_len] = torch.from_numpy(data[:actual_len])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        mag, phase = stft_transform.transform(sound)
        
        # Cắt phổ về 512x512 để khớp với tín hiệu ẩn từ mạng nơ-ron
        covers = mag[:, :512, :512].unsqueeze(1)
        phases = phase[:, :512, :512].unsqueeze(1)

        with torch.no_grad():
            # Gọi forward chuẩn của mô hình
            containers, revealed_internal = model(secrets, covers)

        extracted_test = revealed_internal.squeeze(0)
        if extracted_test.shape[0] == 4: 
            extracted_test = extracted_test[:3, :, :]
            
        extracted_test = extracted_test.permute(1, 2, 0).cpu().numpy()
        t_min, t_max = extracted_test.min(), extracted_test.max()
        extracted_test = (extracted_test - t_min) / (t_max - t_min + 1e-9)
        extracted_test = np.clip(extracted_test * 255.0, 0, 255).astype(np.uint8)
        
        test_dir = os.path.join(os.getcwd(), "outputs", "test")
        os.makedirs(test_dir, exist_ok=True)
        Image.fromarray(extracted_test).save(os.path.join(test_dir, "internal_check.png"))

        container_wav_tensor = stft_transform.inverse(containers.squeeze(1), phases.squeeze(1))
        container_wav = container_wav_tensor.cpu().numpy()[0]
        
        final_stego_audio[:actual_len] = container_wav[:actual_len]
        
        diff_audio = data[:actual_len] - final_stego_audio[:actual_len]
        real_snr = 10 * np.log10(np.sum(data[:actual_len]**2) / (np.sum(diff_audio**2) + 1e-10))
        mse_img = F.mse_loss(secrets[:, :3, :, :], revealed_internal[:, :3, :, :]).item()
        real_psnr = 20 * np.log10(1.0 / np.sqrt(mse_img + 1e-10))

        sf.write(output_path, np.clip(final_stego_audio, -0.99, 0.99), samplerate, subtype='FLOAT')
        
        return {
            "status": "success", "output_path": output_path, 
            "mse": float(mse_img), "psnr": float(round(real_psnr, 2)), 
            "snr": float(round(real_snr, 2)), "capacity": 256*256*3
        }
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def decode(stego_path, output_folder="outputs", **kwargs):
    try:
        algo_name = kwargs.get("algo_name", "unet")
        model, stft_transform = get_model(algo_name)
        
        data, _ = sf.read(stego_path, dtype='float32')
        if data.ndim > 1: data = data[:, 0]
        
        sound = torch.zeros(67522)
        sound[:min(len(data), 67522)] = torch.from_numpy(data[:min(len(data), 67522)])
        sound = sound.unsqueeze(0).to(DEVICE)
        
        mag, _ = stft_transform.transform(sound)
        
        # Đồng bộ kích thước 512x512 tại decode
        containers = mag[:, :512, :512].unsqueeze(1) 

        with torch.no_grad():
            revealed = model.RN(containers)

        revealed_img = revealed.squeeze(0)
        if revealed_img.shape[0] == 4: 
            revealed_img = revealed_img[:3, :, :]
            
        revealed_img = revealed_img.permute(1, 2, 0).cpu().numpy()

        rmin, rmax = revealed_img.min(), revealed_img.max()
        revealed_img = (revealed_img - rmin) / (rmax - rmin + 1e-9)
        revealed_img = np.clip(revealed_img * 255.0, 0, 255).astype(np.uint8)
        
        os.makedirs(output_folder, exist_ok=True)
        output_image_path = os.path.join(output_folder, f"extracted_{algo_name}.png")
        Image.fromarray(revealed_img).save(output_image_path)

        return {"status": "success", "type": "image", "save_path": output_image_path}
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}