#!/usr/bin/env python3
"""
批量生成游戏行情数据包。
用法: python generate_packs.py --count 10 --output ../../src/data/marketPacks/
"""

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
    parser = argparse.ArgumentParser(description="批量生成游戏行情数据包")
    parser.add_argument("--count", type=int, default=10,
                        help="生成几组数据包")
    parser.add_argument("--output", default="../../src/data/marketPacks",
                        help="输出目录（相对于脚本位置）")
    args = parser.parse_args()

    output_dir = Path(__file__).parent / args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    if not SECTOR_MAPPING_PATH.exists():
        print("❌ 未找到 sector_mapping.json，请先运行 fetch_stock_data.py")
        return

    with open(SECTOR_MAPPING_PATH, encoding="utf-8") as f:
        sector_mapping = json.load(f)

    stock_pool = load_stock_pool()

    for i in range(args.count):
        print(f"Generating pack {i + 1}/{args.count}...", end=" ")
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
