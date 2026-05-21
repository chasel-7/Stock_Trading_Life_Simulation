from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.db import get_db
from app.models.user import User
from app.schemas.user import UserLoginRequest, UserResponse

router = APIRouter()

@router.post("/login", response_model=UserResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.id).first()
    if not user:
        # 新用户注册
        user = User(
            id=payload.id,
            username=payload.username,
            avatar_url=payload.avatar_url,
            elo_rating=1200
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 允许更新昵称/头像
        user.username = payload.username
        if payload.avatar_url:
            user.avatar_url = payload.avatar_url
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
