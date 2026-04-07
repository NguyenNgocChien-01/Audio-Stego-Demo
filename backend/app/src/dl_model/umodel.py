import torch
import numpy as np
import torch.nn as nn
import torch.nn.functional as F

def pixel_unshuffle(img, downscale_factor):
    c = img.shape[1]
    kernel = torch.zeros(size=[downscale_factor * downscale_factor * c, 1, downscale_factor, downscale_factor], device=img.device, dtype=img.dtype)
    for y in range(downscale_factor):
        for x in range(downscale_factor):
            kernel[x + y * downscale_factor::downscale_factor*downscale_factor, 0, y, x] = 1
    return F.conv2d(img, kernel, stride=downscale_factor, groups=c)

class PixelUnshuffle(nn.Module):
    def __init__(self, downscale_factor):
        super(PixelUnshuffle, self).__init__()
        self.downscale_factor = downscale_factor
    def forward(self, img):
        return pixel_unshuffle(img, self.downscale_factor)

class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = nn.Sequential(nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1), nn.LeakyReLU(0.8, inplace=True))
        self.conv2 = nn.Sequential(nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1), nn.LeakyReLU(0.8, inplace=True))
    def forward(self, x):
        return self.conv2(self.conv1(x))

class Down(nn.Module):
    def __init__(self, in_channels, out_channels, downsample_factor=8):
        super().__init__()
        self.conv = DoubleConv(in_channels, out_channels)
        self.down = nn.MaxPool2d(downsample_factor)
    def forward(self, x):
        return self.down(self.conv(x))

class Up(nn.Module):
    def __init__(self, in_channels, out_channels, opp_channels=-1):
        super().__init__()
        self.up = nn.Sequential(
            nn.ConvTranspose2d(in_channels , out_channels, kernel_size=3, stride=4, output_padding=0),
            nn.LeakyReLU(0.8, inplace=True),
            nn.ConvTranspose2d(out_channels , out_channels, kernel_size=3, stride=2, output_padding=1),
            nn.LeakyReLU(0.8, inplace=True)
        )
        if opp_channels == -1: opp_channels = out_channels
        self.conv = DoubleConv(opp_channels+out_channels, out_channels)
    def forward(self, mix, im_opposite, au_opposite = None):
        mix = self.up(mix)
        x = torch.cat((mix, im_opposite), dim=1)
        return self.conv(x)

class PrepHidingNet(nn.Module):
    def __init__(self, transform='cosine', stft_small=True, embed='stretch'):
        super(PrepHidingNet, self).__init__()
        self._transform = transform
        self._stft_small = stft_small
        self.embed = embed
        self.pixel_shuffle = nn.PixelShuffle(2)
        
        self.im_encoder_layers = nn.ModuleList([Down(1, 64), Down(64, 64 * 2)])
        self.im_decoder_layers = nn.ModuleList([Up(64 * 2, 64), Up(64, 1)])

    def forward(self, im):
        im = self.pixel_shuffle(im)
        if self.embed == 'stretch':
            if self._transform == 'fourier' and not self._stft_small:
                im = nn.Upsample(scale_factor=(4, 2), mode='bilinear', align_corners=True)(im)
            else:
                im = nn.Upsample(scale_factor=(2, 1), mode='bilinear', align_corners=True)(im)
        
        im_enc = [im]
        for enc_layer in self.im_encoder_layers: im_enc.append(enc_layer(im_enc[-1]))
        mix_dec = [im_enc.pop(-1)]
        for dec_layer_idx, dec_layer in enumerate(self.im_decoder_layers): 
            mix_dec.append(dec_layer(mix_dec[-1], im_enc[-1 - dec_layer_idx], None))
        return mix_dec[-1]

class RevealNet(nn.Module):
    def __init__(self, mp_decoder=None, stft_small=True, embed='stretch', luma=False):
        super(RevealNet, self).__init__()
        self.mp_decoder = mp_decoder
        self.pixel_unshuffle = PixelUnshuffle(2)
        self._stft_small = stft_small
        self.embed = embed
        self.luma = luma
        self.im_encoder_layers = nn.ModuleList([Down(1, 64), Down(64, 64 * 2)])
        self.im_decoder_layers = nn.ModuleList([Up(64 * 2, 64), Up(64, 1)])
        
        if self.embed in ['blocks', 'blocks2', 'ws_replicate']:
            self.decblocks = nn.Parameter(torch.rand(2 if self._stft_small else 8))

    def forward(self, ct, ct_phase=None):
        if self.embed == 'stretch': ct = F.interpolate(ct, size=(256 * 2, 256 * 2))
        im_enc = [ct]
        for enc_layer in self.im_encoder_layers: im_enc.append(enc_layer(im_enc[-1]))
        im_dec = [im_enc.pop(-1)]
        for dec_layer_idx, dec_layer in enumerate(self.im_decoder_layers): 
            im_dec.append(dec_layer(im_dec[-1], im_enc[-1 - dec_layer_idx]))
        
        revealed = torch.narrow(self.pixel_unshuffle(im_dec[-1]), 1, 0, 3)
        
        if self.embed in ['blocks', 'blocks2', 'ws_replicate']:
            if self._stft_small: 
                replicas = torch.split(revealed, 256, 2)
            else:
                replicas = torch.split(revealed, 256, 3)
                replicas = tuple([torch.split(replicas[i], 256, 2) for i in range(2)])
                replicas = replicas[0] + replicas[1]
                
            if len(replicas) == len(self.decblocks):
                revealed = torch.sum(torch.stack([replicas[i]*self.decblocks[i] for i in range(len(self.decblocks))]), dim=0)
            else:
                revealed = replicas[0]
        return revealed

def get_luma(img):
    return 0.2990 * img[:,0:1,:,:] + 0.5870 * img[:,1:2,:,:] + 0.1140 * img[:,2:3,:,:]

class StegoUNet(nn.Module):
    def __init__(self, transform='cosine', stft_small=True, ft_container='mag', mp_encoder='single', mp_decoder='double', mp_join='mean', permutation=False, embed='stretch', luma='luma'):
        super().__init__()
        self.transform = transform
        self.stft_small = stft_small
        self.ft_container = ft_container
        self.mp_encoder = mp_encoder
        self.mp_decoder = mp_decoder
        self.mp_join = mp_join
        self.permutation = permutation
        self.embed = embed
        
        self.luma = luma if isinstance(luma, bool) else (luma == 'True')
        if transform != 'fourier' or ft_container != 'magphase': self.mp_decoder = None 
        
        self.PHN = PrepHidingNet(self.transform, self.stft_small, self.embed)
        self.RN = RevealNet(self.mp_decoder, self.stft_small, self.embed, self.luma)
        
        if self.embed in ['blocks', 'blocks2', 'ws_replicate']:
            self.encblocks = nn.Parameter(torch.rand(2 if self.stft_small else 8))
            
    def forward(self, secret, cover, cover_phase=None):
        if self.luma:
            fourth_channel = get_luma(secret)
        else:
            fourth_channel = torch.zeros(secret.shape[0],1,256,256).type(torch.float32).to(secret.device)
            
        secret = torch.cat((secret, fourth_channel), 1)
        hidden_signal = self.PHN(secret)
        
        if self.embed in ['blocks', 'blocks2', 'ws_replicate']:
            if self.stft_small:
                hidden_signal = torch.cat((hidden_signal*self.encblocks[0], hidden_signal*self.encblocks[1]), 2)
            else:
                parts = [hidden_signal * self.encblocks[i] for i in range(8)]
                col1 = torch.cat(parts[0:4], 2)
                col2 = torch.cat(parts[4:8], 2)
                hidden_signal = torch.cat((col1, col2), 3)

        container = cover + hidden_signal
        revealed = self.RN(container)
        return container, revealed