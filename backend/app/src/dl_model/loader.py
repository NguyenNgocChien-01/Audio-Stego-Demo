import torch
import numpy as np
from PIL import Image
from .pystct import sdct_torch
from torch_stft import STFT

class ImageProcessor():
    def __init__(self, image_path, colorspace='RGB'):
        self.image = Image.open(image_path).convert(colorspace)

    def crop(self, proportion=2**6):
        nx, ny = self.image.size
        n = min(nx, ny)
        left = top = n / proportion
        right = bottom = (proportion - 1) * n / proportion
        self.image = self.image.crop((left, top, right, bottom))

    def scale(self, n=256):
        self.image = self.image.resize((n, n), Image.LANCZOS)

    def normalize(self):
        self.image = np.array(self.image).astype('float') / 255.0

    def forward(self):
        self.crop()
        self.scale()
        self.normalize()
        return self.image

class AudioProcessor():
    def __init__(self, transform='fourier', stft_small=True):
        self._limit = 67522 
        if transform == 'cosine': 
            self._frame_length = 2**10
            self._frame_step = 2**7 + 2
        else:
            if stft_small: 
                self._frame_length = 2**11 - 1
                self._frame_step = 2**7 + 4
            else: 
                self._frame_length = 2**12 - 1
                self._frame_step = 2**6 + 2
                
        self._transform = transform
        if self._transform == 'fourier':
            self.stft = STFT(filter_length=self._frame_length, hop_length=self._frame_step, win_length=self._frame_length, window='hann')

    def forward(self, audio_path):
        import soundfile as sf
        import torch
        
        # 1. ĐỌC TRỰC TIẾP BẰNG SOUNDFILE (Bỏ qua torchaudio)
        data, self.sr = sf.read(audio_path, dtype='float32')
        
        # 2. CHUẨN HÓA DỮ LIỆU ĐỂ GIỐNG HỆT ĐẦU RA CỦA TORCHAUDIO
        # Soundfile trả về (frames, channels), Torchaudio trả về (channels, frames)
        if data.ndim == 1:
            tensor_data = torch.from_numpy(data).unsqueeze(0) # File Mono (1 kênh)
        else:
            tensor_data = torch.from_numpy(data).t() # File Stereo (2 kênh)

        self.sound = tensor_data
        sound = self.sound[0] # Chỉ lấy kênh đầu tiên (kênh trái) để xử lý
        
        # 3. CẮT HOẶC ĐỆM BẰNG ZERO (Giữ nguyên logic gốc của bạn)
        tmp = torch.zeros([self._limit, ])
        
        if sound.numel() < self._limit:
            tmp[:sound.numel()] = sound[:]
        else:
            tmp[:] = sound[:self._limit]
            
        if self._transform == 'cosine': 
            from .pystct import sdct_torch
            return sdct_torch(tmp.type(torch.float32), frame_length=self._frame_length, frame_step=self._frame_step)
        elif self._transform == 'fourier':
            magnitude, phase = self.stft.transform(tmp.unsqueeze(0).type(torch.float32))
            return magnitude, phase