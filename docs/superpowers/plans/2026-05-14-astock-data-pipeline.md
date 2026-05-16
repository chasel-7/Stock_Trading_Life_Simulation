# 真实A股数据模糊化管线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现设计规格§4.3所述的数据管线 — 从真实A股历史数据中提取10~15个连续交易日，进行模糊化处理（价格缩放、抹去身份），生成可用于游戏的行情JSON文件，替代当前纯随机模拟数据。

**Architecture:** 创建独立的 Python 数据处理脚本（离线运行），从 CSV/API 获取A股历史数据，经过模糊化管线输出多组 `MarketDataPack` 格式JSON。游戏侧仅需加载不同JSON文件，无需修改运行时代码。

**Tech Stack:** Python 3 + pandas（数据处理脚本），TypeScript（游戏侧加载）

---

## File Structure

| 文件 | 职责 | 操作 |
|------|------|------|
| `scripts/data_pipeline/fetch_stock_data.py` | 从公开API获取A股历史数据 | NEW |
| `scripts/data_pipeline/obfuscate.py` | 模糊化处理核心逻辑 | NEW |
| `scripts/data_pipeline/generate_packs.py` | 批量生成行情数据包 | NEW |
| `scripts/data_pipeline/requirements.txt` | Python依赖 | NEW |
| `scripts/data_pipeline/README.md` | 使用说明 | NEW |
| `src/data/marketPacks/` | 存放多组预生成行情JSON | NEW (目录) |
| `src/managers/MarketGenerator.ts` | 增加加载预生成数据包的方法 | MODIFY |

---

### Task 1: 创建数据获取脚本

**Files:**
- Create: `scripts/data_pipeline/requirements.txt`
- Create: `scripts/data_pipeline/fetch_stock_data.py`

- [ ] **Step 1: 创建 requirements.txt**

```
akshare>=1.12.0
pandas>=2.0.0
```

> `akshare` 是开源A股数据接口库，无需付费API Key。

- [ ] **Step 2: 编写数据获取脚本**

```python
#!/usr/bin/env python3
"""
从 akshare 获取A股历史日线数据，保存为本地CSV。
用法: python fetch_stock_data.py --output raw_data/
"""

import os
import argparse
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta

# 100支候选真实股票（覆盖5大板块）
STOCK_CANDIDATES = {
    "消费": [
        "600519", "000858", "000568", "603288", "002304",
        "002714", "600887", "000895", "603369", "002557",
    ],
    "科技": [
        "002230", "300661", "688111", "300433", "002415",
        "688036", "300124", "002236", "688981", "300496",
    ],
    "制造": [
        "300750", "601012", "002460", "600584", "601127",
        "300274", "002371", "601689", "600031", "300122",
    ],
    "医药": [
        "300760", "000661", "300347", "300759", "600276",
        "300015", "002007", "300601", "603259", "300529",
    ],
    "金融": [
        "601398", "600036", "601318", "600030", "601688",
        "000001", "601166", "601818", "600000", "601601",
    ],
}

def fetch_stock(code: str, start: str, end: str) -> pd.DataFrame:
    """获取单支股票日线数据"""
    try:
        df = ak.stock_zh_a_hist(
            symbol=code, period="daily",
            start_date=start, end_date=end, adjust="qfq"
        )
        df = df.rename(columns={
            "日期": "date", "开盘": "open", "收盘": "close",
            "最高": "high", "最低": "low", "成交量": "volume",
        })
        return df[["date", "open", "close", "high", "low"]]
    except Exception as e:
        print(f"  ⚠️ Failed to fetch {code}: {e}")
        return pd.DataFrame()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="scripts/data_pipeline/raw_data")
    parser.add_argument("--years", type=int, default=5, help="获取最近N年数据")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=args.years * 365)).strftime("%Y%m%d")

    for sector, codes in STOCK_CANDIDATES.items():
        print(f"\n📊 板块: {sector}")
        for code in codes:
            print(f"  Fetching {code}...", end=" ")
            df = fetch_stock(code, start, end)
            if not df.empty:
                path = os.path.join(args.output, f"{code}.csv")
                df.to_csv(path, index=False)
                print(f"✅ {len(df)} days")
            else:
                print("❌ skipped")

    # 保存板块映射
    import json
    mapping = {}
    for sector, codes in STOCK_CANDIDATES.items():
        for code in codes:
            mapping[code] = sector
    with open(os.path.join(args.output, "sector_mapping.json"), "w") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Done. Data saved to {args.output}/")

if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit**

```bash
git add scripts/data_pipeline/requirements.txt scripts/data_pipeline/fetch_stock_data.py
git commit -m "feat: add A-share historical data fetcher script"
```

---

### Task 2: 创建模糊化处理核心模块

**Files:**
- Create: `scripts/data_pipeline/obfuscate.py`

- [ ] **Step 1: 编写模糊化逻辑**

设计规格§4.3的模糊化流程：
1. 取10~15个连续交易日
2. 价格缩放到¥5~50
3. 抹去日期/公司名
4. 仅保留：开盘价→各步进价格→收盘价
5. 分配代号和关键词

```python
#!/usr/bin/env python3
"""
A股数据模糊化处理模块。
将真实历史数据转换为游戏可用的匿名行情。
"""

import json
import random
import numpy as np
import pandas as pd
from pathlib import Path

TICKS_PER_DAY = 40
TARGET_PRICE_MIN = 5.0
TARGET_PRICE_MAX = 50.0

# 股票池代号映射（从 stockPool.json 加载）
STOCK_POOL_PATH = Path(__file__).parent.parent.parent / "src" / "data" / "stockPool.json"

def load_stock_pool():
    with open(STOCK_POOL_PATH) as f:
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
    original_min = window[["open", "close", "high", "low"]].min().min()
    original_max = window[["open", "close", "high", "low"]].max().max()
    original_range = original_max - original_min
    if original_range == 0:
        original_range = 1.0

    target_base = random.uniform(TARGET_PRICE_MIN, TARGET_PRICE_MAX * 0.6)
    scale = random.uniform(0.3, 0.8) * (TARGET_PRICE_MAX - TARGET_PRICE_MIN) / original_range

    result = window.copy()
    for col in ["open", "close", "high", "low"]:
        result[col] = ((window[col] - original_min) * scale + target_base).round(2)
    return result

def generate_ticks(row: pd.Series, count: int = TICKS_PER_DAY) -> list:
    """基于OHLC生成盘中步进价格序列"""
    o, c, h, l = row["open"], row["close"], row["high"], row["low"]
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
                    keywords: list, window_size: int = 15) -> dict | None:
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
            "open": row["open"],
            "close": row["close"],
            "high": row["high"],
            "low": row["low"],
            "ticks": ticks,
        })

    return {
        "id": game_id,
        "sector": sector,
        "keywords": keywords,
        "dailyData": daily_data,
    }
```

- [ ] **Step 2: Commit**

```bash
git add scripts/data_pipeline/obfuscate.py
git commit -m "feat: add A-share data obfuscation module"
```

---

### Task 3: 创建批量生成脚本

**Files:**
- Create: `scripts/data_pipeline/generate_packs.py`

- [ ] **Step 1: 编写批量生成脚本**

```python
#!/usr/bin/env python3
"""
批量生成游戏行情数据包。
用法: python generate_packs.py --count 10 --output ../../src/data/marketPacks/
"""

import os
import json
import random
import argparse
from pathlib import Path
from obfuscate import load_stock_pool, obfuscate_stock

RAW_DATA_DIR = Path(__file__).parent / "raw_data"
SECTOR_MAPPING_PATH = RAW_DATA_DIR / "sector_mapping.json"
STOCKS_PER_SECTOR = 3
RECOMMENDED_COUNT = 3
TOTAL_DAYS = 15

def generate_one_pack(pack_id: int, raw_dir: Path, sector_mapping: dict,
                      stock_pool: dict) -> dict:
    """生成一组行情数据包"""
    stocks = []
    csv_files = list(raw_dir.glob("*.csv"))

    # 按板块分组可用的CSV
    by_sector = {}
    for csv_path in csv_files:
        code = csv_path.stem
        sector = sector_mapping.get(code)
        if sector:
            if sector not in by_sector:
                by_sector[sector] = []
            by_sector[sector].append(csv_path)

    # 每板块抽3支
    used_ids = set()
    for sector, csv_list in by_sector.items():
        random.shuffle(csv_list)
        pool_stocks = stock_pool.get(sector, [])
        random.shuffle(pool_stocks)

        count = 0
        for csv_path in csv_list:
            if count >= STOCKS_PER_SECTOR:
                break
            if count >= len(pool_stocks):
                break

            pool_entry = pool_stocks[count]
            game_id = pool_entry["id"]
            if game_id in used_ids:
                continue

            result = obfuscate_stock(
                str(csv_path), game_id, sector,
                pool_entry["keywords"], TOTAL_DAYS,
            )
            if result:
                stocks.append(result)
                used_ids.add(game_id)
                count += 1

    # 标记推荐股
    rec_indices = random.sample(range(len(stocks)), min(RECOMMENDED_COUNT, len(stocks)))
    for i, stock in enumerate(stocks):
        stock["isRecommended"] = i in rec_indices

    return {"totalDays": TOTAL_DAYS, "stocks": stocks}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10, help="生成几组数据包")
    parser.add_argument("--output", default="../../src/data/marketPacks")
    args = parser.parse_args()

    output_dir = Path(__file__).parent / args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(SECTOR_MAPPING_PATH) as f:
        sector_mapping = json.load(f)

    stock_pool = load_stock_pool()

    for i in range(args.count):
        print(f"Generating pack {i+1}/{args.count}...", end=" ")
        pack = generate_one_pack(i, RAW_DATA_DIR, sector_mapping, stock_pool)
        out_path = output_dir / f"market_pack_{i:03d}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(pack, f, ensure_ascii=False)
        print(f"✅ {len(pack['stocks'])} stocks → {out_path.name}")

    # 生成索引文件
    index = {"packs": [f"market_pack_{i:03d}.json" for i in range(args.count)]}
    with open(output_dir / "index.json", "w") as f:
        json.dump(index, f, indent=2)
    print(f"\n✅ Generated {args.count} packs to {output_dir}/")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/data_pipeline/generate_packs.py
git commit -m "feat: add batch market pack generation script"
```

---

### Task 4: 修改 MarketGenerator 支持加载预生成数据包

**Files:**
- Modify: `src/managers/MarketGenerator.ts`

- [ ] **Step 1: 添加从预生成包加载的方法**

```typescript
// src/managers/MarketGenerator.ts — 添加静态方法

/** 从预生成数据包目录随机加载一组行情 */
static async loadRandomPack(): Promise<MarketDataPack | null> {
  try {
    const indexResp = await fetch('/data/marketPacks/index.json');
    if (!indexResp.ok) return null;
    const index = await indexResp.json() as { packs: string[] };
    if (!index.packs || index.packs.length === 0) return null;

    const randomPack = index.packs[Math.floor(Math.random() * index.packs.length)];
    const packResp = await fetch(`/data/marketPacks/${randomPack}`);
    if (!packResp.ok) return null;
    return await packResp.json() as MarketDataPack;
  } catch {
    return null;
  }
}

/** 智能选择：优先加载真实数据包，失败时降级为随机生成 */
static async generateOrLoad(totalDays?: number): Promise<MarketDataPack> {
  const pack = await MarketGenerator.loadRandomPack();
  if (pack) return pack;
  return MarketGenerator.generate(totalDays);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/managers/MarketGenerator.ts
git commit -m "feat: add pregenerated market pack loading with fallback"
```

---

### Task 5: 创建 README 使用说明

**Files:**
- Create: `scripts/data_pipeline/README.md`

- [ ] **Step 1: 编写使用说明**

```markdown
# A股数据模糊化管线

将真实A股历史数据转换为游戏行情数据包。

## 前置条件

```bash
cd scripts/data_pipeline
pip install -r requirements.txt
```

## 使用流程

### 1. 获取原始数据
```bash
python fetch_stock_data.py --output raw_data/ --years 5
```
从 akshare 获取50支A股最近5年日线数据，保存到 `raw_data/` 目录。

### 2. 生成行情数据包
```bash
python generate_packs.py --count 10 --output ../../src/data/marketPacks/
```
从原始数据中随机抽取并模糊化，生成10组游戏行情。

### 3. 部署
将 `src/data/marketPacks/` 目录部署到 `public/data/marketPacks/`，
游戏运行时通过 `MarketGenerator.loadRandomPack()` 加载。

## 模糊化规则

1. 从历史数据中随机取15个连续交易日
2. 价格线性缩放到 ¥5~50 区间
3. 抹去日期、公司名、成交量
4. 基于OHLC生成40个盘中步进价格
5. 分配游戏代号（消费-01）和关键词
```

- [ ] **Step 2: Commit**

```bash
git add scripts/data_pipeline/README.md
git commit -m "docs: add data pipeline README"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计§4.3 完整覆盖 — 真实数据→连续交易日→模糊化→代号分配 ✅
- [x] **Placeholder scan:** 无 TBD ✅
- [x] **Type consistency:** 输出JSON格式与 `MarketDataPack` 接口兼容 ✅
- [x] **降级方案:** `generateOrLoad()` 在无预生成数据时自动降级为随机生成 ✅
