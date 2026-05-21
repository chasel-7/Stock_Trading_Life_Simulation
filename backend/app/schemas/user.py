from typing import Optional
from pydantic import BaseModel

class UserLoginRequest(BaseModel):
    id: str                         # 微信 OpenID 或游客临时生成的 UUID
    username: str                   # 昵称
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    avatar_url: Optional[str]
    elo_rating: int
