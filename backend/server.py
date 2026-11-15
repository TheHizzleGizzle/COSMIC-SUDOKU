"""Cosmic Sudoku runs fully offline on the phone.

This tiny service only exists so the preview/deploy pipeline has a healthy
backend to talk to. The game never calls it for gameplay.
"""
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="Cosmic Sudoku")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"app": "Cosmic Sudoku", "status": "ok", "mode": "offline-first"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)
