import json
import mimetypes
import os
from typing import Optional, Tuple


PAYLOAD_MAGIC = b"STEGO_META_V1\n"


def build_file_payload(
    file_path: str,
    original_filename: Optional[str] = None,
    original_mime_type: Optional[str] = None,
) -> bytes:
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = original_filename or os.path.basename(file_path)
    mime_type = original_mime_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    payload_type = "file"
    if mime_type.startswith("image/"):
        payload_type = "image"
    elif mime_type.startswith("audio/"):
        payload_type = "audio"

    metadata = {
        "payload_type": payload_type,
        "filename": filename,
        "mime_type": mime_type,
    }
    metadata_bytes = json.dumps(metadata, separators=(",", ":")).encode("utf-8")
    return PAYLOAD_MAGIC + len(metadata_bytes).to_bytes(4, "big") + metadata_bytes + file_bytes


def unpack_payload_blob(blob: bytes) -> Tuple[Optional[dict], bytes]:
    if not blob.startswith(PAYLOAD_MAGIC):
        return None, blob

    header_start = len(PAYLOAD_MAGIC)
    if len(blob) < header_start + 4:
        return None, blob

    metadata_len = int.from_bytes(blob[header_start:header_start + 4], "big")
    metadata_start = header_start + 4
    metadata_end = metadata_start + metadata_len
    if len(blob) < metadata_end:
        return None, blob

    try:
        metadata = json.loads(blob[metadata_start:metadata_end].decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, blob

    return metadata, blob[metadata_end:]
