from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__: str = "users"
    
    id: str = Field(primary_key=True, index=True)   # 微信 OpenID 或 游客 UUID
    username: str                                   # 昵称
    avatar_url: Optional[str] = None                # 头像地址
    elo_rating: int = Field(default=1200)           # 天梯匹配分
    created_at: datetime = Field(default_factory=datetime.utcnow)
