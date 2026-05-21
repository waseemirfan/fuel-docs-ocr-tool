from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()  # Load .env before anything else

from app.database import init_db
from app.services.delivery_points import load_sites
from app.api.routes import upload, documents, review, export, sites, health, config

app = FastAPI(title="FuelDocs OCR Tool", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(review.router)
app.include_router(export.router)
app.include_router(sites.router)
app.include_router(health.router)
app.include_router(config.router)

os.makedirs("uploads", exist_ok=True)
os.makedirs("data", exist_ok=True)


@app.on_event("startup")
async def startup():
    await init_db()
    load_sites()
