from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class GameRecord(SQLModel, table=True):
    __tablename__: str = "game_records"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    role_type: str                                  # 职业定位
    match_seed: str = Field(default="default_seed")  # 行情种子
    final_cash: float                               # 最终现金
    final_assets: float                             # 最终总资产
    profit_rate: float                              # 收益率
    transaction_log: str                            # 交易细节 JSON
    score_metrics: str                              # 雷达图评分与称号 JSON
    is_verified: bool = Field(default=False)         # 是否重放验证通过
    is_practice: bool = Field(default=False)         # 是否为单人练习赛
    created_at: datetime = Field(default_factory=datetime.utcnow)
