#!/usr/bin/env python3
"""
A股数据模糊化处理模块。
将真实历史数据转换为游戏可用的匿名行情。
"""

import json
import random
import pandas as pd
from pathlib import Path

TICKS_PER_DAY = 40
TARGET_PRICE_MIN = 5.0
TARGET_PRICE_MAX = 50.0

# 股票池代号映射（从 stockPool.json 加载）
STOCK_POOL_PATH = Path(__file__).parent.parent.parent / "src" / "data" / "stockPool.json"


def load_stock_pool():
    """按板块加载股票池"""
    with open(STOCK_POOL_PATH, encoding="utf-8") as f:
        data = json.load(f)
    by_sector = {}
    for s in data["stocks"]:
        sector = s["sector"]
        if sector not in by_sector:
            by_sector[sector] = []
        by_sector[sector].append(s)
    return by_sector


def pick_random_window(df: pd.DataFrame, window_size: int = 15) -> pd.DataFrame:
    """从历史数据中随机取一段连续交易日"""
    if len(df) < window_size:
        return pd.DataFrame()
    start = random.randint(0, len(df) - window_size)
    return df.iloc[start:start + window_size].reset_index(drop=True)


def scale_prices(window: pd.DataFrame) -> pd.DataFrame:
    """将价格缩放到 TARGET_PRICE_MIN ~ TARGET_PRICE_MAX"""
    cols = ["open", "close", "high", "low"]
    original_min = window[cols].min().min()
    original_max = window[cols].max().max()
    original_range = original_max - original_min
    if original_range == 0:
        original_range = 1.0

    target_base = random.uniform(TARGET_PRICE_MIN, TARGET_PRICE_MAX * 0.6)
    scale = random.uniform(0.3, 0.8) * (TARGET_PRICE_MAX - TARGET_PRICE_MIN) / original_range

    result = window.copy()
    for col in cols:
        result[col] = ((window[col] - original_min) * scale + target_base).round(2)
    return result


def generate_ticks(row, count: int = TICKS_PER_DAY) -> list:
    """基于OHLC生成盘中步进价格序列"""
    o, c, h, l = float(row["open"]), float(row["close"]), float(row["high"]), float(row["low"])
    ticks = [o]
    price_range = h - l
    if price_range == 0:
        price_range = 0.01

    for i in range(1, count - 1):
        progress = i / (count - 1)
        base = o + (c - o) * progress
        noise = (random.random() - 0.5) * price_range * 0.3
        price = max(l, min(h, base + noise))
        ticks.append(round(price, 2))

    ticks.append(c)
    return ticks


def obfuscate_stock(csv_path: str, game_id: str, sector: str,
                    keywords: list, window_size: int = 15):
    """将一支真实股票数据模糊化为游戏格式"""
    df = pd.read_csv(csv_path)
    if len(df) < window_size:
        return None

    window = pick_random_window(df, window_size)
    scaled = scale_prices(window)

    daily_data = []
    for _, row in scaled.iterrows():
        ticks = generate_ticks(row)
        daily_data.append({
            "open": float(row["open"]),
            "close": float(row["close"]),
            "high": float(row["high"]),
            "low": float(row["low"]),
            "ticks": ticks,
        })

    return {
        "id": game_id,
        "sector": sector,
        "keywords": keywords,
        "dailyData": daily_data,
    }
