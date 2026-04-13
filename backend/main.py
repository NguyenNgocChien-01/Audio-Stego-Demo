from fastapi import FastAPI
from app.routers import stego
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Stego App")

EXPOSED_HEADERS = [
    "Metrics-MSE", 
    "Metrics-PSNR", 
    "Metrics-SNR", 
    "Metrics-K", 
    "Algo-Name"
]
# Hỗ trợ nhiều origin (Xóa dấu / ở cuối)
allowed_origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "http://frontend:3000",
    "http://stego.nnchien.id.vn",  # Thêm domain production
    "https://stego.nnchien.id.vn"  # Thêm bản https nếu có
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=EXPOSED_HEADERS
)

@app.get("/")
async def root():
    return {"message": "Welcome to Stego App!"}

app.include_router(stego.router)
