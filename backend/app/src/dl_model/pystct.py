import numpy as np
import librosa
import scipy.fft
import torch
import torch_dct

def sdct(signal, frame_length, frame_step, window="hamming"):
    framed = librosa.util.frame(signal, frame_length=frame_length, hop_length=frame_step)
    if window is not None:
        window = librosa.filters.get_window(window, frame_length, fftbins=True).astype(signal.dtype)
        framed = framed * window[:, np.newaxis]
    return scipy.fft.dct(framed, norm="ortho", axis=-2)

def isdct(dct, *, frame_step, frame_length=None, window="hamming"):
    frame_length2, n_frames = dct.shape
    assert frame_length in {None, frame_length2}
    signal = overlap_add(scipy.fft.idct(dct, norm="ortho", axis=-2), frame_step)
    if window is not None:
        window = librosa.filters.get_window(window, frame_length2, fftbins=True).astype(dct.dtype)
        window_frames = np.tile(window[:, np.newaxis], (1, n_frames))
        window_signal = overlap_add(window_frames, frame_step)
        signal = signal / window_signal
    return signal

def overlap_add(framed, frame_step):
    *shape_rest, frame_length, n_frames = framed.shape
    deframed_size = (n_frames - 1) * frame_step + frame_length
    deframed = np.zeros((*shape_rest, deframed_size), dtype=framed.dtype)
    for i in range(n_frames):
        pos = i * frame_step
        deframed[..., pos : pos + frame_length] += framed[..., i]
    return deframed

def sdct_torch(signals, frame_length, frame_step, window=torch.hamming_window):
    framed = signals.unfold(-1, frame_length, frame_step)
    if callable(window): window = window(frame_length).to(framed)
    if window is not None: framed = framed * window
    return torch_dct.dct(framed, norm="ortho").transpose(-1, -2)

def isdct_torch(dcts, *, frame_step, frame_length=None, window=torch.hamming_window):
    *_, frame_length2, n_frames = dcts.shape
    assert frame_length in {None, frame_length2}
    signals = torch_overlap_add(
        torch_dct.idct(dcts.transpose(-1, -2), norm="ortho").transpose(-1, -2),
        frame_step=frame_step,
    )
    if callable(window): window = window(frame_length2).to(signals)
    if window is not None:
        window_frames = window[:, None].expand(-1, n_frames)
        window_signal = torch_overlap_add(window_frames, frame_step=frame_step)
        signals = signals / window_signal
    return signals

def torch_overlap_add(framed, *, frame_step, frame_length=None):
    *rest, frame_length2, n_frames = framed.shape
    assert frame_length in {None, frame_length2}
    return torch.nn.functional.fold(
        framed.reshape(-1, frame_length2, n_frames),
        output_size=(((n_frames - 1) * frame_step + frame_length2), 1),
        kernel_size=(frame_length2, 1),
        stride=(frame_step, 1),
    ).reshape(*rest, -1)