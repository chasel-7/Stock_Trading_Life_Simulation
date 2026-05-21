from fastapi import APIRouter
from app.api.endpoints import auth, game

api_router = APIRouter()

@api_router.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Stock Life Simulator API is healthy"}

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(game.router, prefix="/game", tags=["game"])


