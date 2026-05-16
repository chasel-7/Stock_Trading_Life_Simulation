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

从 akshare 获取100支A股最近5年日线数据，保存到 `raw_data/` 目录。

> 首次运行约需10-15分钟，取决于网络状况。

### 2. 生成行情数据包

```bash
python generate_packs.py --count 10 --output ../../src/data/marketPacks/
```

从原始数据中随机抽取并模糊化，生成10组游戏行情。

### 3. 部署

将 `src/data/marketPacks/` 目录部署到 `public/data/marketPacks/`，
游戏运行时通过 `MarketGenerator.loadRandomPack()` 加载。

```
public/
  data/
    marketPacks/
      index.json
      market_pack_000.json
      market_pack_001.json
      ...
```

## 模糊化规则

| 步骤 | 说明 |
|------|------|
| 1. 抽取窗口 | 从历史数据中随机取15个连续交易日 |
| 2. 价格缩放 | 线性缩放到 ¥5~50 区间 |
| 3. 身份抹除 | 抹去日期、公司名、成交量 |
| 4. Tick 生成 | 基于OHLC生成40个盘中步进价格 |
| 5. 代号分配 | 分配游戏代号（消费-01）和关键词 |

## 文件结构

```
scripts/data_pipeline/
  ├── requirements.txt      # Python依赖
  ├── fetch_stock_data.py   # 数据获取脚本
  ├── obfuscate.py          # 模糊化处理模块
  ├── generate_packs.py     # 批量生成脚本
  ├── README.md             # 本文件
  └── raw_data/             # 原始CSV（gitignore）
      ├── 600519.csv
      ├── ...
      └── sector_mapping.json
```

## 注意事项

- `raw_data/` 目录已添加到 `.gitignore`，不会提交到版本库
- 每次运行 `generate_packs.py` 会生成不同的随机组合
- 游戏侧通过 `MarketGenerator.generateOrLoad()` 智能降级：优先加载真实数据包，无数据时自动使用纯随机生成
