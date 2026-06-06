import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database.db import get_db
from app.models.game_record import GameRecord
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    score: float
    detail: Optional[dict] = None


@router.get("", response_model=List[LeaderboardEntry])
def get_leaderboard(
    type: str = Query("profit", description="'profit' for total return, 'overall' for all-rounder"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Get leaderboard rankings.
    - type=profit: ranked by profit_rate
    - type=overall: ranked by weighted 4-axis score
    """
    # Only include verified, non-practice records
    records = (
        db.query(GameRecord)
        .filter(GameRecord.is_verified == True, GameRecord.is_practice == False)
        .all()
    )

    # Group by user, take their best record
    best_per_user = {}

    for record in records:
        user = db.query(User).filter(User.id == record.user_id).first()
        username = user.username if user else record.user_id[:8]

        if type == "profit":
            score = record.profit_rate
        elif type == "overall":
            # Parse score_metrics JSON
            try:
                metrics = json.loads(record.score_metrics) if isinstance(record.score_metrics, str) else record.score_metrics
            except (json.JSONDecodeError, TypeError):
                metrics = {}

            # Weighted sum: 投资智慧×0.3 + 心态稳定×0.25 + 社交回报×0.25 + 生活平衡×0.2
            wisdom = metrics.get("投资智慧", 50)
            mindset = metrics.get("心态稳定", 50)
            social = metrics.get("社交回报", 50)
            balance = metrics.get("生活平衡", 50)
            score = wisdom * 0.3 + mindset * 0.25 + social * 0.25 + balance * 0.2
        else:
            score = record.profit_rate

        # Keep best score per user
        if record.user_id not in best_per_user or score > best_per_user[record.user_id]["score"]:
            detail = None
            if type == "overall":
                try:
                    metrics = json.loads(record.score_metrics) if isinstance(record.score_metrics, str) else record.score_metrics
                except (json.JSONDecodeError, TypeError):
                    metrics = {}
                detail = metrics

            best_per_user[record.user_id] = {
                "user_id": record.user_id,
                "username": username,
                "score": round(score, 1),
                "detail": detail,
            }

    # Sort and rank
    sorted_entries = sorted(best_per_user.values(), key=lambda x: x["score"], reverse=True)
    result = []
    for i, entry in enumerate(sorted_entries[:limit]):
        result.append(LeaderboardEntry(
            rank=i + 1,
            user_id=entry["user_id"],
            username=entry["username"],
            score=entry["score"],
            detail=entry["detail"],
        ))

    return result
