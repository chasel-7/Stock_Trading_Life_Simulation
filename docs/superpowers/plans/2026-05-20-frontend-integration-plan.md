# 股票人生模拟器 — 第三阶段（前端开发与 API 对接）开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建基于 React 18 + Vite 的前端应用，实现核心的炒股界面、盘后消费决策界面、历史战绩查询页面，并与后端 REST API（登录、战绩提报、历史拉取）打通。

**Architecture:** 
1. **模块化前端结构**：在 `frontend/` 目录下初始化 Vite 项目。
2. **状态管理 (Zustand)**：维护本地游玩状态（当前交易日、持有现金、各股持仓、交易日志列表 `transaction_log`、场景决策日志 `scene_log`）。
3. **数据请求层**：使用 Axios / Fetch 进行 API 请求封装，实现离线优先，日常操盘本地更新，结算时一次性提交。
4. **视觉系统**：采用极富科技感的暗黑毛玻璃风（Glassmorphism），加入红色/绿色闪烁微动效。

**Tech Stack:** React 18, Vite, TypeScript/JavaScript, Zustand, CSS

---

### Task 1: 初始化 React-Vite 前端应用与状态管理器

**Files:**
- Create: `frontend/package.json` (通过 Vite 初始化)
- Create: `frontend/src/store/useGameStore.js`
- Create: `frontend/src/api/client.js`

- [x] **Step 1: 初始化 Vite + React 应用**
  在终端中运行（遵循 help 引导与非交互式命令）：
  `npx -y create-vite@latest frontend --template react`

- [x] **Step 2: 创建 API 客户端请求封装**
  写入 `frontend/src/api/client.js`：
  ```javascript
  const API_BASE = "http://localhost:8000/api/v1";

  export const api = {
      async login(id, username) {
          const res = await fetch(`${API_BASE}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, username })
          });
          return res.json();
      },
      async submitRecord(recordData) {
          const res = await fetch(`${API_BASE}/game/record`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recordData)
          });
          return res.json();
      },
      async getHistory(userId) {
          const res = await fetch(`${API_BASE}/game/user/${userId}/history`);
          return res.json();
      }
  };
  ```

- [x] **Step 3: 安装 Zustand 状态管理库**
  在 `frontend/` 目录运行：
  `npm install zustand`

- [x] **Step 4: 实现局内操盘与决策的核心状态存储**
  创建状态机，记录本地持仓及所有买卖流水，用于结算时上报给后端校验。
  写入 `frontend/src/store/useGameStore.js`：
  ```javascript
  import { create } from 'zustand';

  export const useGameStore = create((set, get) => ({
      user: null,
      isPlaying: false,
      day: 1,
      cash: 30000.0,
      assets: 30000.0,
      holdings: {},          // {"科技-01": 数量}
      transactionLog: [],    // [{"day", "stock", "type", "price", "qty"}]
      sceneLog: [],          // [{"day", "scene", "spend"}]
      matchSeed: "default_seed",
      roleType: "internet_worker",

      setUser: (user) => set({ user }),
      startGame: (seed, role) => set({
          isPlaying: true,
          day: 1,
          cash: role === "internet_worker" ? 30000.0 : 20000.0,
          assets: role === "internet_worker" ? 30000.0 : 20000.0,
          holdings: {},
          transactionLog: [],
          sceneLog: [],
          matchSeed: seed,
          roleType: role
      }),
      
      buyStock: (stock, price, qty) => {
          const cost = price * qty;
          const fee = cost * 0.01;
          const totalCost = cost + fee;
          if (get().cash < totalCost) return false;
          
          set((state) => {
              const currentQty = state.holdings[stock] || 0;
              const newHoldings = { ...state.holdings, [stock]: currentQty + qty };
              const logEntry = { day: state.day, stock, type: "BUY", price, qty };
              return {
                  cash: state.cash - totalCost,
                  holdings: newHoldings,
                  transactionLog: [...state.transactionLog, logEntry]
              };
          });
          get().updateAssets(price); // 刷新总资产
          return true;
      },
      
      sellStock: (stock, price, qty) => {
          const currentQty = get().holdings[stock] || 0;
          if (currentQty < qty) return false;
          
          const revenue = price * qty;
          const fee = revenue * 0.01;
          
          set((state) => {
              const newHoldings = { ...state.holdings, [stock]: currentQty - qty };
              if (newHoldings[stock] === 0) delete newHoldings[stock];
              const logEntry = { day: state.day, stock, type: "SELL", price, qty };
              return {
                  cash: state.cash + (revenue - fee),
                  holdings: newHoldings,
                  transactionLog: [...state.transactionLog, logEntry]
              };
          });
          get().updateAssets(price);
          return true;
      },

      addSceneSpend: (sceneName, spend) => set((state) => ({
          cash: state.cash - spend,
          sceneLog: [...state.sceneLog, { day: state.day, scene: sceneName, spend }]
      })),

      nextDay: (dailySalary, dailyCost) => set((state) => ({
          day: state.day + 1,
          cash: state.cash + dailySalary - dailyCost
      })),

      updateAssets: (currentPriceMap) => {
          // 根据最新股价重算总资产
          set((state) => {
              let stockVal = 0;
              for (const [stock, qty] of Object.entries(state.holdings)) {
                  const price = typeof currentPriceMap === 'number' ? currentPriceMap : (currentPriceMap[stock] || 0);
                  stockVal += qty * price;
              }
              return { assets: state.cash + stockVal };
          });
      }
  }));
  ```

---

### Task 2: 搭建核心 UI 组件 (K线图、自选看板、决策卡片)

**Files:**
- Create: `frontend/src/components/KLineChart.jsx`
- Create: `frontend/src/components/StockRow.jsx`
- Create: `frontend/src/components/DecisionCard.jsx`
- Create: `frontend/src/index.css` (毛玻璃/暗黑风主题定义)

- [x] **Step 1: 编写高端科技暗黑风全局样式**
  写入 `frontend/src/index.css`：
  ```css
  :root {
      --bg-dark: #0f0f12;
      --card-bg: rgba(25, 25, 35, 0.65);
      --border-color: rgba(255, 255, 255, 0.08);
      --neon-green: #00e676;
      --neon-red: #ff1744;
      --text-white: #ffffff;
      --text-gray: #90a4ae;
  }

  body {
      background-color: var(--bg-dark);
      color: var(--text-white);
      font-family: 'Inter', -apple-system, sans-serif;
      margin: 0;
      padding: 0;
  }

  .glass-card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .neon-btn-green {
      background: transparent;
      border: 1px solid var(--neon-green);
      color: var(--neon-green);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
  }
  .neon-btn-green:hover {
      background: var(--neon-green);
      color: #000;
      box-shadow: 0 0 10px var(--neon-green);
  }
  ```

- [x] **Step 2: 实现迷你价格 K 线/走势折线组件**
  利用 SVG 绘制平滑的价格折线及最高/最低价。
  写入 `frontend/src/components/KLineChart.jsx`：
  ```jsx
  import React from 'react';

  export default function KLineChart({ prices }) {
      if (!prices || prices.length === 0) return null;
      
      const maxVal = Math.max(...prices);
      const minVal = Math.min(...prices);
      const range = maxVal - minVal || 1;
      
      // 将价格映射为 SVG 的坐标点
      const points = prices.map((p, index) => {
          const x = (index / (prices.length - 1)) * 300;
          const y = 80 - ((p - minVal) / range) * 70; // 留白 10 像素
          return `${x},${y}`;
      }).join(' ');

      return (
          <div className="glass-card" style={{ padding: '10px', height: '100px' }}>
              <svg viewBox="0 0 300 80" style={{ width: '100%', height: '100%' }}>
                  <polyline
                      fill="none"
                      stroke="url(#gradient-line)"
                      strokeWidth="2.5"
                      points={points}
                  />
                  <defs>
                      <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#29b6f6" />
                          <stop offset="100%" stopColor="#00e676" />
                      </linearGradient>
                  </defs>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-gray)' }}>
                  <span>最低: ¥{minVal.toFixed(2)}</span>
                  <span>最高: ¥{maxVal.toFixed(2)}</span>
              </div>
          </div>
      );
  }
  ```

- [x] **Step 3: 编写个股操盘行组件 (StockRow)**
  实现点击弹出买入/卖出控制弹窗。
  写入 `frontend/src/components/StockRow.jsx`：
  ```jsx
  import React, { useState } from 'react';

  export default function StockRow({ stockName, price, holdingQty, onTrade }) {
      const [tradeQty, setTradeQty] = useState(100);

      return (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', margin: '8px 0' }}>
              <div>
                  <div style={{ fontWeight: 'bold' }}>{stockName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>持有: {holdingQty} 股</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-green)' }}>
                  ¥{price.toFixed(2)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                      type="number"
                      value={tradeQty}
                      onChange={(e) => setTradeQty(parseInt(e.target.value) || 0)}
                      style={{ width: '60px', background: '#222', border: '1px solid #44', color: '#fff', borderRadius: '4px', textAlign: 'center' }}
                  />
                  <button className="neon-btn-green" onClick={() => onTrade('BUY', tradeQty)}>买入</button>
                  <button className="neon-btn-green" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }} onClick={() => onTrade('SELL', tradeQty)}>卖出</button>
              </div>
          </div>
      );
  }
  ```

---

### Task 3: 页面整合与 API 接入测试

**Files:**
- Create: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`

- [x] **Step 1: 整合核心游戏控制流并在最后一关自动提交结算**
  写入并整合页面至 `frontend/src/App.jsx`，控制登录 ➔ 操盘 ➔ 结算战绩自动上报逻辑。
  ```jsx
  import React, { useState, useEffect } from 'react';
  import { useGameStore } from './store/useGameStore';
  import { api } from './api/client';
  import KLineChart from './components/KLineChart';
  import StockRow from './components/StockRow';

  export default function App() {
      const store = useGameStore();
      const [userId, setUserId] = useState('guest_' + Math.random().toString(36).substr(2, 9));
      const [username, setUsername] = useState('菜鸟散户');
      const [mockPrice, setMockPrice] = useState(10.0);
      const [history, setHistory] = useState([]);

      // 自动生成的本地测试股价分时 (模拟盘中游走)
      useEffect(() => {
          if (!store.isPlaying) return;
          const interval = setInterval(() => {
              const delta = (Math.random() - 0.5) * 0.2;
              const nextP = Math.max(0.1, mockPrice + delta);
              setMockPrice(nextP);
              store.updateAssets(nextP);
          }, 1000);
          return () => clearInterval(interval);
      }, [store.isPlaying, mockPrice]);

      const handleLogin = async () => {
          const userData = await api.login(userId, username);
          store.setUser(userData);
          store.startGame("seed_game_" + Date.now(), "internet_worker");
      };

      const handleSettlement = async () => {
          // 提交战绩
          const recordData = {
              user_id: store.user.id,
              role_type: store.roleType,
              match_seed: store.matchSeed,
              final_cash: store.cash,
              final_assets: store.assets,
              profit_rate: ((store.assets - 30000) / 30000) * 100,
              transaction_log: store.transactionLog,
              scene_log: store.sceneLog,
              score_metrics: { "智慧": 75, "心态": 80 }
          };
          await api.submitRecord(recordData);
          alert("战绩提交成功！校验完成。");
          
          // 重新获取历史记录
          const records = await api.getHistory(store.user.id);
          setHistory(records);
      };

      if (!store.user) {
          return (
              <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }} className="glass-card">
                  <h2>股票人生模拟器 - 登录入口</h2>
                  <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="用户ID" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="角色昵称" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
                  <button onClick={handleLogin} className="neon-btn-green" style={{ width: '100%' }}>以游客登录并开始炒股</button>
              </div>
          );
      }

      return (
          <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
              <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
                  <h3>玩家: {store.user.username} (Elo: {store.user.elo_rating})</h3>
                  <p>交易天数: Day {store.day} / 15</p>
                  <p>可用现金: ¥{store.cash.toFixed(2)} | 总资产: ¥{store.assets.toFixed(2)}</p>
                  <button className="neon-btn-green" onClick={() => store.nextDay(800, 200)}>进入下一天</button>
                  <button className="neon-btn-green" style={{ marginLeft: '10px', borderColor: '#ff9800', color: '#ff9800' }} onClick={handleSettlement}>结束本局并提交</button>
              </div>

              <h3>股票看盘行情</h3>
              <KLineChart prices={[9.8, 9.9, 10.1, 10.0, mockPrice]} />
              
              <StockRow
                  stockName="科技-01"
                  price={mockPrice}
                  holdingQty={store.holdings["科技-01"] || 0}
                  onTrade={(type, qty) => {
                      if (type === 'BUY') store.buyStock("科技-01", mockPrice, qty);
                      if (type === 'SELL') store.sellStock("科技-01", mockPrice, qty);
                  }}
              />

              {history.length > 0 && (
                  <div className="glass-card" style={{ marginTop: '20px', padding: '15px' }}>
                      <h4>最近战绩列表 (已通过后端重放验证)</h4>
                      {history.map((record) => (
                          <div key={record.id} style={{ fontSize: '12px', borderBottom: '1px solid #333', padding: '5px 0' }}>
                              局ID: {record.id} | 总资产: ¥{record.final_assets.toFixed(2)} | 收益率: {record.profit_rate.toFixed(1)}% | 验证: {record.is_verified ? "通过" : "作弊拒绝"}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }
  ```

- [x] **Step 2: 启动前端服务，进行联调测试**
  在 `frontend/` 目录运行：
  `npm run dev`
  在浏览器访问前端并进行“登录 ➔ 买卖操盘 ➔ 下一日结算 ➔ 提报战绩 ➔ 查看真伪”的完整功能调测。
