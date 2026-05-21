import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database.db import get_db
from app.models.user import User
from app.models.game_record import GameRecord
from app.schemas.game_record import RecordCreateRequest, RecordResponse

from app.services.verification import VerificationService
from app.services.stock_generator import StockGenerator

router = APIRouter()

@router.post("/record", response_model=RecordResponse)
def save_game_record(payload: RecordCreateRequest, db: Session = Depends(get_db)):
    # 验证用户是否存在
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 进行重放验证
    is_verified = VerificationService.verify_game_log(
        seed=payload.match_seed,
        role_type=payload.role_type,
        transaction_log=payload.transaction_log,
        scene_log=payload.scene_log,
        submitted_final_assets=payload.final_assets,
        submitted_score_metrics=payload.score_metrics
    )
    
    # 仅非练习赛进行天梯 Elo 变更
    if not payload.is_practice:
        if is_verified:
            # 验证通过：依据收益率计算积分增量 (收益率如 30.0 增加 30 积分)
            rating_change = max(-50, min(100, int(payload.profit_rate)))
            user.elo_rating = max(100, user.elo_rating + rating_change)
        else:
            # 验证不通过（作弊）：直接扣除 100 积分
            user.elo_rating = max(100, user.elo_rating - 100)
    
    # 序列化为 JSON 字符串
    tx_log_str = json.dumps(payload.transaction_log)
    score_metrics_str = json.dumps(payload.score_metrics)
    
    record = GameRecord(
        user_id=payload.user_id,
        role_type=payload.role_type,
        match_seed=payload.match_seed,
        final_cash=payload.final_cash,
        final_assets=payload.final_assets,
        profit_rate=payload.profit_rate,
        transaction_log=tx_log_str,
        score_metrics=score_metrics_str,
        is_verified=is_verified,
        is_practice=payload.is_practice
    )
    db.add(record)
    db.add(user)
    db.commit()
    db.refresh(record)
    db.refresh(user)
    return record

@router.get("/user/{user_id}/history", response_model=List[RecordResponse])
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    # 验证用户是否存在
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    records = db.query(GameRecord).filter(GameRecord.user_id == user_id).all()
    return records

@router.get("/market-info")
def get_market_info(seed: str, day: int):
    from app.services.verification import VerificationService
    # 根据种子挑选 15 支股票
    selected_stocks = StockGenerator.get_selected_stocks(seed)
    generator = StockGenerator(seed)
    
    prices_data = {}
    bounds_data = {}
    intelligence = []
    
    for stock in selected_stocks:
        init_p = VerificationService.STOCK_INITIAL_PRICES.get(stock, 10.0)
        prices, high, low = generator.generate_prices_for_day(stock, day, init_p)
        prices_data[stock] = prices
        bounds_data[stock] = {
            "open": prices[0],
            "high": high,
            "low": low,
            "close": prices[-1]
        }
        
        # 动态计算未来3日趋势
        curr_close = prices[-1]
        lookahead_day = min(15, day + 3)
        if lookahead_day > day:
            future_prices, _, _ = generator.generate_prices_for_day(stock, lookahead_day, init_p)
            future_close = future_prices[-1]
            pct_change = (future_close - curr_close) / curr_close
            
            if pct_change >= 0.25:
                trend = "暴涨"
                direction = "up"
            elif pct_change >= 0.10:
                trend = "大涨"
                direction = "up"
            elif pct_change <= -0.25:
                trend = "暴跌"
                direction = "down"
            elif pct_change <= -0.10:
                trend = "阴跌"
                direction = "down"
            else:
                trend = "震荡"
                direction = "flat"
        else:
            trend = "震荡"
            direction = "flat"
            
        intelligence.append({
            "stock": stock,
            "trend": trend,
            "direction": direction
        })
        
    return {
        "stocks": selected_stocks,
        "prices": prices_data,
        "bounds": bounds_data,
        "intelligence": intelligence
    }

