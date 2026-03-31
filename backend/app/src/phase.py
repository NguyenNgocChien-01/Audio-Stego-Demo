import os
import numpy as np
import scipy.io.wavfile as wavfile

def _get_data_bytes(secret_input):
    if os.path.isfile(secret_input):
        with open(secret_input, 'rb') as f: return f.read()
    return secret_input.encode('utf-8')

def _bytes_to_bits(data_bytes):
    full_data = data_bytes + b"||DATA_END||"
    return np.unpackbits(np.frombuffer(full_data, dtype=np.uint8))

def _bits_to_bytes(bits):
    padding = (8 - (len(bits) % 8)) % 8
    if padding > 0:
        bits = np.concatenate((bits, np.zeros(padding, dtype=np.uint8)))
    return np.packbits(bits).tobytes()

def _read_audio_float(filepath):
    rate, audio_data = wavfile.read(filepath)
    if np.issubdtype(audio_data.dtype, np.integer):
        audio_data = audio_data.astype(np.float32) / np.iinfo(audio_data.dtype).max
    if len(audio_data.shape) > 1:
        audio_data = audio_data[:, 0]
    return rate, audio_data

def _write_audio_float(filepath, rate, audio_data):
    max_val = np.max(np.abs(audio_data))
    if max_val > 1.0: audio_data = audio_data / max_val
    wavfile.write(filepath, rate, audio_data.astype(np.float32))

def _calculate_segment_params(audio_len, sample_rate):
    seg_len = max(min(2 ** int(np.log2(sample_rate * 1.5)), 131072), 8192)
    seg_num = int(np.ceil(audio_len / seg_len))
    usable_bins = int((seg_len // 2) * 0.8) 
    return seg_len, seg_num, usable_bins

def calculate_metrics_float(original, stego):
    min_len = min(len(original), len(stego))
    orig = original[:min_len].astype(np.float64)
    mod = stego[:min_len].astype(np.float64)
    
    diff = orig - mod
    mse = np.mean(diff ** 2)
    if mse == 0: return 0.0, 100.0, 100.0
    
    psnr = 20 * np.log10(1.0 / np.sqrt(mse))
    signal_power = np.sum(orig ** 2)
    noise_power = np.sum(diff ** 2)
    snr = 100.0 if noise_power == 0 else 10 * np.log10(signal_power / noise_power)
            
    return float(mse), float(psnr), float(snr)

def encode(cover_path, secret_input, output_path, **kwargs):
    try:
        rate, audio = _read_audio_float(cover_path)
        original_copy = audio.copy()
        
        data_bytes = _get_data_bytes(secret_input)
        msg_bits = _bytes_to_bits(data_bytes)
        msg_len = len(msg_bits)
        
        seg_len, seg_num, bits_per_seg = _calculate_segment_params(len(audio), rate)
        capacity = bits_per_seg * seg_num
        
        if msg_len > capacity:
            raise ValueError(f"File quá lớn! Cần {msg_len} bits, sức chứa {capacity} bits.")
        
        target_len = seg_num * seg_len
        if len(audio) < target_len: 
            audio = np.pad(audio, (0, target_len - len(audio)), mode='constant')
        
        segs = audio.reshape((seg_num, seg_len))
        fft_segs = np.fft.fft(segs)
        M, P = np.abs(fft_segs), np.angle(fft_segs)
        
        PHASE_0, PHASE_1 = np.pi/4, -np.pi/4
        phase_values = np.where(msg_bits == 0, PHASE_0, PHASE_1)
        
        start_idx = int((seg_len // 2) * 0.1)
        curr = 0
        
        for i in range(seg_num):
            bits_here = min(bits_per_seg, msg_len - curr)
            if bits_here <= 0: break
            
            seg_phases = phase_values[curr : curr + bits_here]
            P[i, start_idx:start_idx+bits_here] = seg_phases
            P[i, seg_len - (start_idx+bits_here) + 1 : seg_len - start_idx + 1] = -seg_phases[::-1]
            curr += bits_here
            
        mod_fft = M * np.exp(1j * P)
        stego_audio = np.fft.ifft(mod_fft).real.ravel()
        
        _write_audio_float(output_path, rate, stego_audio)
        mse, psnr, snr = calculate_metrics_float(original_copy, stego_audio)
        
        return {
            "status": "success",
            "output_path": output_path,
            "mse": mse, "psnr": psnr, "snr": snr,
            "capacity": capacity // 8
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def decode(stego_path, output_folder="outputs", **kwargs):
    try:
        rate, stego_audio = _read_audio_float(stego_path)
        seg_len, seg_num, bits_per_seg = _calculate_segment_params(len(stego_audio), rate)
        
        extracted_bits_list = []
        start_idx = int((seg_len // 2) * 0.1)
        
        for i in range(seg_num):
            segment_start = i * seg_len
            segment_end = (i + 1) * seg_len
            
            if segment_end > len(stego_audio):
                segment = np.pad(stego_audio[segment_start:], (0, segment_end - len(stego_audio)), mode='constant')
            else:
                segment = stego_audio[segment_start:segment_end]
                
            fft_segment = np.fft.fft(segment)
            extracted_phase = np.angle(fft_segment)
            phase_data = extracted_phase[start_idx : start_idx + bits_per_seg]
            
            extracted_bits = (phase_data < 0).astype(np.uint8)
            extracted_bits_list.extend(extracted_bits)
            
        all_bits = np.array(extracted_bits_list, dtype=np.uint8)
        all_bytes = _bits_to_bytes(all_bits)
        
        delimiter_index = all_bytes.find(b"||DATA_END||")
        if delimiter_index == -1:
            return {'status': 'error', 'message': "Không tìm thấy chuỗi kết thúc."}
            
        content = all_bytes[:delimiter_index]
        
        try:
            text = content.decode('utf-8')
            return {'status': 'success', 'type': 'text', 'content_text': text}
        except UnicodeDecodeError:
            os.makedirs(output_folder, exist_ok=True)
            save_path = os.path.join(output_folder, "extracted_phase.bin")
            with open(save_path, 'wb') as f: f.write(content)
            return {'status': 'success', 'type': 'binary', 'save_path': save_path}
            
    except Exception as e:
        return {'status': 'error', 'message': str(e)}