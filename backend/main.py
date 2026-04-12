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
import os

# Hỗ trợ nhiều origin cùng lúc
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3001").split(",")

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
