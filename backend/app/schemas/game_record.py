from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class RecordCreateRequest(BaseModel):
    user_id: str
    role_type: str
    match_seed: str
    final_cash: float
    final_assets: float
    profit_rate: float
    transaction_log: List[Dict[str, Any]]
    scene_log: List[Dict[str, Any]]
    score_metrics: Dict[str, Any]
    is_practice: Optional[bool] = False

class RecordResponse(BaseModel):
    id: int
    user_id: str
    role_type: str
    match_seed: str
    final_cash: float
    final_assets: float
    profit_rate: float
    is_verified: bool
    is_practice: bool
    created_at: datetime

    class Config:
        from_attributes = True
        # 兼容 Pydantic v1 / SQLModel
        orm_mode = True
