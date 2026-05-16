#!/usr/bin/env python3
"""
从 akshare 获取A股历史日线数据，保存为本地CSV。
用法: python fetch_stock_data.py --output raw_data/
"""

import os
import json
import argparse
from datetime import datetime, timedelta

try:
    import akshare as ak
except ImportError:
    print("请先安装依赖: pip install -r requirements.txt")
    exit(1)

# 100支候选真实股票（覆盖5大板块）
STOCK_CANDIDATES = {
    "消费": [
        "600519", "000858", "000568", "603288", "002304",
        "002714", "600887", "000895", "603369", "002557",
        "002568", "603589", "600600", "000860", "002847",
        "600882", "002650", "603156", "000729", "600597",
    ],
    "科技": [
        "002230", "300661", "688111", "300433", "002415",
        "688036", "300124", "002236", "688981", "300496",
        "002049", "300782", "603986", "300223", "002371",
        "688008", "300347", "002241", "300750", "603160",
    ],
    "制造": [
        "601012", "002460", "600584", "601127", "300274",
        "601689", "600031", "300122", "002008", "600406",
        "601766", "000625", "601633", "002594", "600104",
        "000333", "600690", "002475", "601100", "300450",
    ],
    "医药": [
        "300760", "000661", "300759", "600276", "300015",
        "002007", "300601", "603259", "300529", "600196",
        "002422", "600436", "002252", "300003", "300122",
        "300347", "688180", "603392", "002821", "300595",
    ],
    "金融": [
        "601398", "600036", "601318", "600030", "601688",
        "000001", "601166", "601818", "600000", "601601",
        "601328", "601288", "600016", "601229", "601998",
        "000776", "600837", "601377", "002142", "601878",
    ],
}


def fetch_stock(code: str, start: str, end: str):
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
        return None


def main():
    parser = argparse.ArgumentParser(description="获取A股历史日线数据")
    parser.add_argument("--output", default="scripts/data_pipeline/raw_data",
                        help="输出目录")
    parser.add_argument("--years", type=int, default=5,
                        help="获取最近N年数据")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    end = datetime.now().strftime("%Y%m%d")
    start = (datetime.now() - timedelta(days=args.years * 365)).strftime("%Y%m%d")

    total = sum(len(v) for v in STOCK_CANDIDATES.values())
    fetched = 0
    failed = 0

    for sector, codes in STOCK_CANDIDATES.items():
        print(f"\n📊 板块: {sector} ({len(codes)}支)")
        for code in codes:
            print(f"  Fetching {code}...", end=" ")
            df = fetch_stock(code, start, end)
            if df is not None and not df.empty:
                path = os.path.join(args.output, f"{code}.csv")
                df.to_csv(path, index=False)
                print(f"✅ {len(df)} days")
                fetched += 1
            else:
                print("❌ skipped")
                failed += 1

    # 保存板块映射
    mapping = {}
    for sector, codes in STOCK_CANDIDATES.items():
        for code in codes:
            mapping[code] = sector
    with open(os.path.join(args.output, "sector_mapping.json"), "w") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done. Fetched {fetched}/{total} stocks ({failed} failed)")
    print(f"   Output: {args.output}/")


if __name__ == "__main__":
    main()
