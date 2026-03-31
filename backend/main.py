from fastapi import FastAPI
from app.routers import stego
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.db.database import Base, engine
import app.db.models
from app.routers import admin, users

Base.metadata.create_all(bind=engine)  
app = FastAPI(title="Stego App")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import os

# Dùng os.getcwd() để lấy luôn thư mục gốc của project
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    os.makedirs(os.path.join(UPLOAD_DIR, "stego"), exist_ok=True)

app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    os.makedirs(os.path.join(UPLOAD_DIR, "stego"), exist_ok=True)

# Khai báo cho phép tải file
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")


@app.get("/")
async def root():
    return {"message": "Welcome to Stego App!"}

app.include_router(stego.router)
app.include_router(admin.router)
app.include_router(users.router)