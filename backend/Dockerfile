FROM python:3.10-slim

# Chỉ cài những thứ thật sự cần cho xử lý âm thanh cơ bản
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Chạy uvicorn nhẹ nhàng
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]