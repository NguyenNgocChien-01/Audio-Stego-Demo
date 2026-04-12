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
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=EXPOSED_HEADERS
)


@app.get("/")
async def root():
    return {"message": "Welcome to Stego App!"}

app.include_router(stego.router)
