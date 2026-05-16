# Bugfix: K线图/分时图/持仓面板/结算盈亏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复4个互相关联的显示Bug：K线图不显示、分时图不显示、持仓面板数据不正确、日结算未计算股票收益。

**Architecture:** 所有Bug根源在于 TradingScene 中 tick 数据未转发给 StockDetailPanel，K线图首日索引为0导致空数组，以及 HoldingsPanel 未在 Tab 切换时强制刷新。结算盈亏实际已有计算，但持仓显示不对导致用户认为未计算。

**Tech Stack:** Phaser 3 + TypeScript

---

## Root Cause Analysis

### Bug 1: 分时图不显示
- **文件:** `src/scenes/TradingScene.ts` L93-104
- **原因:** `tickEngine.onTick()` 回调中只更新了 `StockListPanel` 和 `HoldingsPanel`，**没有将 tick 价格转发给 `StockDetailPanel.addTick()`**。`TimelineChart.redraw()` 在 `this.prices.length === 0` 时直接 return。

### Bug 2: K线图不显示
- **文件:** `src/ui/CandlestickChart.ts` L33
- **原因:** `dailyData.slice(0, currentDay)` — Day 1 时传入 `currentDay=0`，`slice(0, 0)` 返回空数组 → L34 `if (days.length === 0) return` 直接跳出。
- **同时:** `src/scenes/TradingScene.ts` L134 `for (let d = 0; d <= day; d++)` 生成的 `dailyData` 中，`day=0` 时只有1条数据，但 `CandlestickChart.draw()` 用的是 `currentDay` 参数做 slice，而 `showDetail` 传入的第三个参数是 `day`（0-indexed）。

### Bug 3: 持仓面板数据不正确
- **文件:** `src/scenes/TradingScene.ts` L52-55
- **原因:** `TabBar` 切换回调只做了 `setVisible`，没有**强制刷新** HoldingsPanel。用户买入后切到持仓Tab，如果恰好没有新 tick 触发刷新，就看不到最新数据。

### Bug 4: 日结盈亏未计算股票收益
- **文件:** `src/managers/SettlementManager.ts`
- **实际情况:** Settlement 逻辑**已正确计算**持仓市值和总资产。但由于 Bug 3 导致用户在盘中看到持仓为空，误以为结算也没算进去。核心问题还是持仓显示和刷新。

---

### Task 1: 修复分时图 — 将 tick 数据转发给 StockDetailPanel

**Files:**
- Modify: `src/scenes/TradingScene.ts:93-104`

- [ ] **Step 1: 在 TradingScene 的 tick 回调中增加 detailPanel 更新**

在 `TradingScene.ts` 的 `tickEngine.onTick` 回调中，增加一行将当前显示的股票 tick 转发给 detailPanel：

```typescript
// src/scenes/TradingScene.ts — create() 方法中 onTick 回调
this.tickEngine.onTick((stockId, price, _idx) => {
  const dd = gm.stocks.getDailyData(stockId, day);
  const changePercent = ((price - dd.open) / dd.open) * 100;
  this.stockList.updateStockPrice(stockId, price, changePercent);
  this.holdingsPanel.refresh(gm.state.getState().holdings, this.tickEngine.getCurrentPrices());

  // 🔧 FIX: 将 tick 转发给个股详情面板（如果正在显示该股票）
  this.detailPanel.addTick(stockId, price);

  // 更新顶部资金显示
  cashTxt.setText(`💰 ¥${gm.state.getState().cash.toLocaleString()}`);

  // 微弱音效
  audioManager.playTick();
});
```

- [ ] **Step 2: 修改 StockDetailPanel.addTick 支持按 stockId 过滤**

当前 `addTick(price)` 不区分股票。需要增加 stockId 参数，只有当前显示的股票才更新：

```typescript
// src/ui/StockDetailPanel.ts
private currentStockId = '';

show(stockId: string, dailyData: DailyStockData[], currentDay: number, callbacks: {...}): void {
  this.currentStockId = stockId;  // 🔧 记录当前显示的股票
  // ... 其余不变
}

/** 按 stockId 过滤的 addTick */
addTick(stockId: string, price: number): void {
  if (stockId === this.currentStockId && this.visible) {
    this.timelineChart.addTick(price);
  }
}
```

- [ ] **Step 3: 手动验证**

启动 `npm run dev`，进入盘中交易，点击任意股票进入详情页，确认：
1. 分时线随 tick 实时绘制
2. 面积填充正常显示
3. 价格标签更新

- [ ] **Step 4: Commit**

```bash
git add src/scenes/TradingScene.ts src/ui/StockDetailPanel.ts
git commit -m "fix: forward tick data to StockDetailPanel for timeline chart"
```

---

### Task 2: 修复K线图 — 首日索引越界

**Files:**
- Modify: `src/ui/CandlestickChart.ts:33`
- Modify: `src/scenes/TradingScene.ts:131-141`

- [ ] **Step 1: 修复 CandlestickChart.draw() 的 slice 逻辑**

将 `slice(0, currentDay)` 改为 `slice(0, currentDay + 1)`，确保包含当天数据：

```typescript
// src/ui/CandlestickChart.ts — draw() 方法
draw(dailyData: DailyStockData[], currentDay: number): void {
  this.graphics.clear();
  for (const label of this.labels) { label.destroy(); }
  this.labels = [];

  // 🔧 FIX: 包含当天数据（currentDay 是 0-indexed）
  const days = dailyData.slice(0, currentDay + 1);
  if (days.length === 0) return;

  // ... 后续代码不变
}
```

- [ ] **Step 2: 确认 TradingScene.showDetail 传参正确**

`TradingScene.showDetail` 中 `day` 是 0-indexed，传给 `detailPanel.show()` 的 dailyData 包含 `0..day` 天的数据，`currentDay` 参数也是 `day`。修复后 `CandlestickChart` 会正确取 `slice(0, day+1)` 即包含当天。

当前代码：
```typescript
private showDetail(stockId: string, day: number): void {
  const gm = getGameManager(this);
  const dailyData = [];
  for (let d = 0; d <= day; d++) {
    dailyData.push(gm.stocks.getDailyData(stockId, d));
  }
  this.detailPanel.show(stockId, dailyData, day, { ... });
}
```

`dailyData` 长度 = `day + 1`，传入 `currentDay = day`，修复后 `slice(0, day + 1)` = 全部数据 ✅

- [ ] **Step 3: 手动验证**

进入盘中交易 → 点击股票 → 切换到"日K"标签页，确认：
1. Day 1 显示至少1根蜡烛
2. 后续天数显示对应数量的蜡烛
3. 阳线空心、阴线实心

- [ ] **Step 4: Commit**

```bash
git add src/ui/CandlestickChart.ts
git commit -m "fix: candlestick chart off-by-one on first day"
```

---

### Task 3: 修复持仓面板 — Tab 切换时强制刷新

**Files:**
- Modify: `src/scenes/TradingScene.ts:52-55`

- [ ] **Step 1: 在 Tab 切换回调中强制刷新 HoldingsPanel**

```typescript
// src/scenes/TradingScene.ts — create() 中 TabBar 回调
new TabBar(this, 0, tabY, GAME_WIDTH, ['自选股', '持仓'], (idx) => {
  this.stockList.setVisible(idx === 0);
  this.holdingsPanel.setVisible(idx !== 0);
  // 🔧 FIX: 切换到持仓Tab时强制刷新数据
  if (idx === 1) {
    const state = getGameManager(this).state.getState();
    this.holdingsPanel.refresh(state.holdings, this.tickEngine.getCurrentPrices());
  }
});
```

- [ ] **Step 2: 确保买入/卖出后也刷新持仓面板**

在 `showOrder` 的 `onConfirm` 回调末尾增加一次刷新：

```typescript
// src/scenes/TradingScene.ts — showOrder() 的 onConfirm 末尾
if (result.type === 'buy') {
  gm.state.buyStock(result.stockId, result.amount, price, gm.getCommissionRate());
  audioManager.playBuy();
} else {
  gm.state.sellStock(result.stockId, result.amount, price, gm.getCommissionRate());
  audioManager.playSell();
}

// 🔧 FIX: 交易后立即刷新持仓和现金
this.holdingsPanel.refresh(gm.state.getState().holdings, this.tickEngine.getCurrentPrices());
cashTxt.setText(`💰 ¥${gm.state.getState().cash.toLocaleString()}`);
```

注意：`cashTxt` 是在外层 `create()` 中定义的局部变量，需要提升为类属性才能在 `showOrder` 中访问。

```typescript
// src/scenes/TradingScene.ts — 添加类属性
export class TradingScene extends Phaser.Scene {
  private tickEngine!: PriceTickEngine;
  private stockList!: StockListPanel;
  private holdingsPanel!: HoldingsPanel;
  private detailPanel!: StockDetailPanel;
  private orderDialog!: OrderDialog;
  private tickTimer?: Phaser.Time.TimerEvent;
  private cashTxt!: Phaser.GameObjects.Text;  // 🔧 提升为类属性
  private closed = false;
  // ...
```

在 `create()` 中把 `const cashTxt = ...` 改为 `this.cashTxt = ...`，所有引用 `cashTxt` 的地方改为 `this.cashTxt`。

- [ ] **Step 3: 手动验证**

1. 进入盘中交易，买入一支股票
2. 切换到"持仓"Tab → 确认显示刚买入的股票、市值和盈亏
3. 等待几次 tick → 确认盈亏数字实时更新
4. 卖出股票 → 确认持仓列表更新

- [ ] **Step 4: Commit**

```bash
git add src/scenes/TradingScene.ts
git commit -m "fix: refresh holdings panel on tab switch and after trade"
```

---

### Task 4: 确认日结算盈亏逻辑正确

**Files:**
- Review: `src/managers/SettlementManager.ts`

- [ ] **Step 1: 代码审查确认**

`SettlementManager.settle()` 中：
- L52-57: 遍历所有 holdings，按收盘价计算持仓市值 ✅
- L58: `totalAssets = cash + holdingsValue` ✅
- L61-63: `dailyReturn = (totalAssets - baseTotalAssets) / baseTotalAssets` ✅

结算逻辑本身**已正确实现**。用户看到"未计算股票收益"的原因是 Bug 3 导致盘中持仓显示异常，让人误以为结算也不对。

- [ ] **Step 2: 端到端验证**

1. 完成一次完整的 Day 1（买入 → 收盘 → 场景 → 结算）
2. 在结算页面确认：
   - "持仓市值"显示非零值
   - "总资产" = 现金 + 持仓市值
   - "日收益率"基于总资产计算

- [ ] **Step 3: Commit (如有修改)**

```bash
git add -A
git commit -m "verify: settlement P&L calculation is correct"
```
