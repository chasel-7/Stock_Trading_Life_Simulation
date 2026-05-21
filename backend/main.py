import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.api.endpoints.pvp import router as pvp_ws_router, pvp_manager

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(pvp_ws_router, prefix="/pvp")

from app.database.db import init_db

@app.on_event("startup")
async def startup_event():
    init_db()
    # 开启后台匹配轮询协程
    asyncio.create_task(pvp_manager.poll_matchmaking())

