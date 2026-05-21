# 股票人生模拟器 — 第五阶段（角色选择与多股看盘系统）开发计划

**Goal:** 实现游戏开始前的职业角色选择界面，并把单只股票扩充为 15 支股票池行情大盘，打通多只股票独立走势、自选股列表与买卖交易流程。

---

### Task 1: 实现角色选择界面与属性注入

**Files:**
- Modify: `frontend/src/store/useGameStore.js` (扩展支持 4 个职业)
- Modify: `frontend/src/App.jsx` (新增角色选择视图与特权属性判定)

- [x] **Step 1: 扩展 Zustand 角色属性结构**
  修改 `useGameStore.js`，在 `startGame` 阶段根据选择的角色动态初始化资金、特权参数：
  - 互联网打工人: `cash: 30000`, `dailySalary: 800`, `dailyCost: 200`
  - 销售经理: `cash: 20000`, `dailySalary: 500`, `dailyCost: 300`
  - 自由职业者: `cash: 50000`, `dailySalary: 0~1000` (每回合随机), `dailyCost: 150`
  - 体制内青年: `cash: 15000`, `dailySalary: 400`, `dailyCost: 100`

- [x] **Step 2: 设计炫酷角色卡片选择组件**
  在主界面未开始时，呈现 4 张霓虹边框卡片，展示其属性表（起始资金、薪资、生活费、技能特点），玩家点击选中后开启对局。

---

### Task 2: 实现 15 支股票的实时看盘大盘列表

**Files:**
- Create: `frontend/src/components/WatchList.jsx` (自选股/持仓大盘列表)
- Modify: `frontend/src/App.jsx`

- [x] **Step 1: 扩充股票池生成**
  每个交易日盘中生成 15 支股票的分时变化（板块：消费-01~03, 科技-01~03, 制造-01~03, 医药-01~03, 金融-01~03）。
  
- [x] **Step 2: 编写自选股表格视图**
  提供仿同花顺的自选股行情单行列表：显示代号、当前股价、日内涨跌幅，并以霓虹红/绿呈现数字变色跳动。

- [x] **Step 3: 实现个股详情抽屉切换**
  点击列表中任意股票，主看盘区域切换到对应的 K 线图与下单面板，支持对特定某只股票的仓位操作。
