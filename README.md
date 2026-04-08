#  Stego — Audio Steganography System

Hệ thống ẩn dữ liệu trong file âm thanh với nhiều thuật toán, giao diện web đầy đủ và bảng quản trị.

---

##  Tính năng

- **Encode/Decode** văn bản hoặc file ẩn trong audio WAV
- **Đa thuật toán:** LSB, Random LSB (có mật khẩu), Phase Coding, Deep Learning (UNet)
- **Đo chất lượng:** MSE / PSNR / SNR tự động sau mỗi lần encode
- **Quản trị:** quản lý thuật toán, user, lịch sử transaction
- **API docs** tích hợp sẵn tại `/docs`

---

## Cấu trúc
stego/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── app/
│   │   ├── routers/         # stego, admin, users
│   │   ├── db/              # SQLAlchemy models + engine
│   │   └── src/             # lsb.py, randomlsb.py, phase.py, dl_model/
│   └── uploads/             # file tạm + output stego
├── frontend/
│   └── app/
│       ├── encode/          # trang mã hóa
│       ├── decode/          # trang giải mã
│       └── admin/           # quản lý
└── weights/                 # model checkpoint (*.pt)


---

## 🚀 Cài đặt & Chạy

### Backend
```bash
cd backend
conda activate stego
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| UI | http://localhost:3000 |
| API Docs | http://localhost:8000/docs |

---
##  API chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/stego/encode` | Ẩn dữ liệu vào audio |
| `POST` | `/stego/decode` | Giải mã audio stego |
| `GET` | `/admin/algorithms` | Danh sách thuật toán |

## Tech Stack

**Backend:** FastAPI · SQLAlchemy · PyTorch · librosa  
**Frontend:** Next.js 14 · TypeScript · Tailwind CSS
