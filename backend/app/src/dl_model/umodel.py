import torch
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
from .pystct import sdct_torch, isdct_torch

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
        x = self.conv1(x)
        x = self.conv2(x)
        return x

class Down(nn.Module):
    def __init__(self, in_channels, out_channels, downsample_factor=8):
        super().__init__()
        self.conv = DoubleConv(in_channels, out_channels)
        self.down = nn.MaxPool2d(downsample_factor)
    def forward(self, x):
        x = self.conv(x)
        x = self.down(x)
        return x

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
        if self.embed == 'multichannel':
            self.im_encoder_layers = nn.ModuleList([Down(3, 64), Down(64, 64 * 2)])
            self.im_decoder_layers = nn.ModuleList([Up(64 * 2, 64), Up(64, 8, opp_channels=3)]) if self._stft_small else nn.ModuleList([Up(64 * 2, 64), Up(64, 32, opp_channels=3)])
        else:
            self.im_encoder_layers = nn.ModuleList([Down(1, 64), Down(64, 64 * 2)])
            self.im_decoder_layers = nn.ModuleList([Up(64 * 2, 64), Up(64, 1)])
    def forward(self, im):
        if self.embed != 'multichannel': im = self.pixel_shuffle(im)
        if self.embed == 'stretch':
            if self._transform == 'cosine': im = nn.Upsample(scale_factor=(2, 1), mode='bilinear',align_corners=True)(im)
            elif self._transform == 'fourier':
                if self._stft_small: im = nn.Upsample(scale_factor=(2, 1), mode='bilinear',align_corners=True)(im)
                else: im = nn.Upsample(scale_factor=(4, 2), mode='bilinear',align_corners=True)(im)
        im_enc = [im]
        for enc_layer_idx, enc_layer in enumerate(self.im_encoder_layers): im_enc.append(enc_layer(im_enc[-1]))
        mix_dec = [im_enc.pop(-1)]
        for dec_layer_idx, dec_layer in enumerate(self.im_decoder_layers): mix_dec.append(dec_layer(mix_dec[-1], im_enc[-1 - dec_layer_idx], None))
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
        if self.embed == 'blocks2':
            if self._stft_small: self.decblocks = nn.Parameter(torch.rand(2))
            else: self.decblocks = nn.Parameter(torch.rand(8))
        elif self.embed == 'blocks': self.decblocks = 1/2 * torch.ones(2) if self._stft_small else 1/8 * torch.ones(8)
    def forward(self, ct, ct_phase=None):
        if self.embed == 'stretch': ct = F.interpolate(ct, size=(256 * 2, 256 * 2))
        im_enc = [ct]
        for enc_layer_idx, enc_layer in enumerate(self.im_encoder_layers): im_enc.append(enc_layer(im_enc[-1]))
        im_dec = [im_enc.pop(-1)]
        for dec_layer_idx, dec_layer in enumerate(self.im_decoder_layers): im_dec.append(dec_layer(im_dec[-1], im_enc[-1 - dec_layer_idx]))
        revealed = torch.narrow(self.pixel_unshuffle(im_dec[-1]), 1, 0, 3)
        if self.embed == 'blocks' or self.embed == 'blocks2':
            if self._stft_small: replicas = torch.split(revealed, 256, 2)
            else:
                replicas = torch.split(revealed, 256, 3)
                replicas = tuple([torch.split(replicas[i], 256, 2) for i in range(2)])
                replicas = replicas[0] + replicas[1]
            revealed = torch.sum(torch.stack([replicas[i]*self.decblocks[i] for i in range(len(self.decblocks))]), dim=0)
        return revealed

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
        self.luma = luma
        if transform != 'fourier' or ft_container != 'magphase': self.mp_decoder = None 
        self.PHN = PrepHidingNet(self.transform, self.stft_small, self.embed)
        self.RN = RevealNet(self.mp_decoder, self.stft_small, self.embed, self.luma)
        if self.embed == 'blocks2' or self.embed == 'blocks3':
            if self.stft_small: self.encblocks = nn.Parameter(torch.rand(2))
            else: self.encblocks = nn.Parameter(torch.rand(8))
    def forward(self, secret, cover, cover_phase=None):
        zero = torch.zeros(secret.shape[0],1,256,256).type(torch.float32).to(secret.device)
        secret = torch.cat((secret,zero),1)
        hidden_signal = self.PHN(secret)
        if self.embed == 'blocks' or self.embed == 'blocks2' or self.embed == 'blocks3':
            if self.embed == 'blocks':
                if self.stft_small: hidden_signal = torch.cat((hidden_signal, hidden_signal), 2)
                else:
                    hidden_signal = torch.cat((hidden_signal, hidden_signal), 3)
                    hidden_signal = torch.cat(tuple([hidden_signal for i in range(4)]), 2)
            else:
                if self.stft_small: hidden_signal = torch.cat((hidden_signal*self.encblocks[0], hidden_signal*self.encblocks[1]), 2)
        container = cover + hidden_signal
        revealed = self.RN(container)
        return container, revealed