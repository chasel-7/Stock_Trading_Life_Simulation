# 📂 项目结构与模块设计说明文档 (PROJECT.md)

本项目由**后端 (FastAPI)** 与**前端 (React + Vite)** 两个核心部分构成。以下为整体目录结构以及各模块功能的详细拆解。

---

## 🗺️ 整体目录结构

```text
Stock_Trading_Life_Simulation/
├── backend/                  # 后端服务
│   ├── app/
│   │   ├── api/              # API 路由与控制器 (REST & WebSocket)
│   │   ├── core/             # 系统核心配置
│   │   ├── database/         # 数据库初始化与会话管理
│   │   ├── models/           # 数据库模型 (SQLModel)
│   │   ├── schemas/          # Pydantic 校验 Schema
│   │   └── services/         # 核心业务逻辑服务
│   ├── tests/                # 自动化测试用例
│   ├── main.py               # 后端启动入口
│   └── requirements.txt      # 依赖包列表
│
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── api/              # API 请求层封装
│   │   ├── components/       # UI 公共组件
│   │   ├── store/            # 状态管理与偏见诊断器
│   │   ├── App.jsx           # 游戏逻辑与主界面控制
│   │   ├── index.css         # 全局样式配置
│   │   └── main.jsx          # 前端应用入口
│   ├── package.json          # Node 依赖与脚本
│   └── vite.config.js        # Vite 构建配置
│
└── docs/                     # 项目文档目录
    ├── Requirements.md       # 需求规格说明文档
    └── PROJECT.md            # 本项目结构说明文档
```

---

## 🐍 后端模块详解 (`backend/app`)

### 1. 接口路由层 (`api/endpoints`)
* **[auth.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/api/endpoints/auth.py)**：用户认证。处理新老用户的快速登录，拉取/更新天梯 ELO 分数。
* **[game.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/api/endpoints/game.py)**：游戏记录管理与行情分发。
  * `POST /record`：接收并验证玩家提交的局内流水以防止作弊。
  * `GET /market-info`：核心行情服务。不仅分发当日股票的 240 个 tick 价格，还实现 **【行情情报系统】**，动态透视未来 3 天的价格变化，分析个股是暴涨、大涨、震荡、阴跌还是暴跌。
* **[pvp.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/api/endpoints/pvp.py)**：PVP WebSocket 接口。接收客户端的排队指令和状态更新（天数、资产），并将对手变动向同房玩家实时广播。

### 2. 核心业务服务层 (`services`)
* **[pvp_manager.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/services/pvp_manager.py)**：PVP 对局与机器人调度管理器。
  * 维护在线连接和天梯排队队列。
  * 支持 2 人小规模天梯撮合。
  * **机器人自动填充**：如果排队超过 5 秒，系统会派发带有 `bot_` 前缀的虚拟玩家加入比赛，并在后台根据真实玩家的步进同步模拟并推进机器人的天数与资产。
* **[verification.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/services/verification.py)**：防作弊校验服务。在玩家完赛上传记录时，服务端会模拟重演这 15 天的全部现金变动（包括每种职业薪资、生活费、书店手续费 Buff、买入卖出流水、信用上限），严格校验客户端数据真实性。
* **[stock_generator.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/services/stock_generator.py)**：基于伪随机数种子的股价生成器。根据传入种子与天数，确定性地还原 15 支股票的全天分时数据。
* **[radar_score.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/services/radar_score.py)**：雷达图四维评估服务。根据收益率、社交偏好、交易频率及获取的情报信息，评分四大维度（交易、风险、职业、信息）。

---

## ⚛️ 前端模块详解 (`frontend/src`)

### 1. 状态管理与计算层 (`store`)
* **[useGameStore.js](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/store/useGameStore.js)**：核心 Zustand Store。
  * 维护游戏进行状态、流动现金、股票持仓、各职业设定（薪资与生活费）、书店 Buff 剩余天数。
  * 控制交易操作（`buyStock` / `sellStock` 扣费及信用额度检查）。
  * 包含盘后结算、破产平仓结算逻辑。
* **[diagnostics.js](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/store/diagnostics.js)**：行为偏见诊断器。
  * 解析全局交易日志（`transactionLog`），动态跟进仓位微调、持仓均价更新。
  * 诊断 **“损失厌恶（Loss Aversion）”** 偏见——科学衡量玩家是倾向于“保本死扛”还是“果断止损”，剔除零均值分母，保证数据健壮性。

### 2. 公共 UI 组件库 (`components`)
* **[KLineChart.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/components/KLineChart.jsx)**：操盘主力分时折线图。
* **[PVPMonitor.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/components/PVPMonitor.jsx)**：右下角 PVP 局内看板。当与电脑玩家匹配时，会在名字前贴心渲染 `🤖` 标签以示区别，并动态展现对手的资产柱状图。
* **[WatchList.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/components/WatchList.jsx)**：自选股实时报价列表。

### 3. 控制与视图组装层 (`App.jsx`)
* 管理游戏在 `LOBBY` (大厅), `TRADE` (盘中操盘), `NIGHT` (盘后社交), `DECISION` (事件抉择) 和 `SETTLEMENT` (终局复盘) 五大生命周期阶段的流转。
* 整合 **“盘前推演晨报”**、**“工作场所随机事件”**（包括 14:00 强制停牌的紧急开会事件）、**“局内授信负债自动清仓”** 弹窗。
