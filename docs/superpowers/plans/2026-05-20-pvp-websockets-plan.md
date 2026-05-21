# 股票人生模拟器 — 第四阶段（PVP 联机匹配与局内同步）开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现多人 PVP 异步联机匹配、局内对手盈亏率进度条同步，以及终局 Elo 天梯积分的自动核算发放。

**Architecture:** 
1. **后端 (FastAPI WebSockets)**：
   - 建立 `PVPManager`（内存并发安全类），维护在线 WebSocket 连接池与 `MatchmakingQueue` 队列。
   - 每 3 秒执行一次匹配检测，为相近 ELo 的玩家分配房间并生成共享种子（Seed）。
   - 监听局内各玩家进度上报 `update_status` 消息，向房间内其他人实时广播。
2. **前端 (React WebSockets)**：
   - 建立局内 WebSocket 监听，并在操盘界面右下角实时画出对手的名字、当前交易日和盈亏率对比列表。
   - 结束时在结算页面弹出多人的资产天梯排名和积分增减（Elo ELO 变动动画）。

**Tech Stack:** Python FastAPI WebSockets, React WebSockets API, HTML5 Canvas/CSS

---

### Task 1: 实现后端 PVPManager 与匹配队列处理器

**Files:**
- Create: `backend/app/services/pvp_manager.py`
- Create: `backend/app/api/endpoints/pvp.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_pvp.py`

- [x] **Step 1: 编写线程安全的匹配与对局房间管理器**
  支持连接登记、状态上报、匹配轮询逻辑。
  写入 `backend/app/services/pvp_manager.py`：
  ```python
  import asyncio
  import uuid
  import random
  from typing import Dict, List, Set
  from fastapi import WebSocket

  class PVPManager:
      def __init__(self):
          self.active_connections: Dict[str, WebSocket] = {}          # {user_id: websocket}
          self.queue: List[Dict[str, Any]] = []                       # [{"user_id", "elo"}]
          # 房间模型：{match_id: {"seed", "participants": {user_id: {"day", "assets", "is_finished"}}}}
          self.matches: Dict[str, Dict[str, Any]] = {} 
          self.user_to_match: Dict[str, str] = {}                     # {user_id: match_id}

      async def register_connection(self, user_id: str, websocket: WebSocket):
          await websocket.accept()
          self.active_connections[user_id] = websocket

      def unregister_connection(self, user_id: str):
          if user_id in self.active_connections:
              del self.active_connections[user_id]
          self.leave_queue(user_id)

      def join_queue(self, user_id: str, elo: int):
          # 防重复排队
          if not any(item["user_id"] == user_id for item in self.queue):
              self.queue.append({"user_id": user_id, "elo": elo})

      def leave_queue(self, user_id: str):
          self.queue = [item for item in self.queue if item["user_id"] != user_id]

      async def broadcast_to_match(self, match_id: str, message: dict):
          """
          向对局房间内的所有玩家推送状态
          """
          match = self.matches.get(match_id)
          if not match:
              return
          for uid in match["participants"].keys():
              ws = self.active_connections.get(uid)
              if ws:
                  try:
                      await ws.send_json(message)
                  except Exception:
                      # 连接可能断开，静默处理
                      pass

      async def poll_matchmaking(self):
          """
          匹配算法：每次凑够 4 人，拉入对局
          """
          while True:
              await asyncio.sleep(3)
              if len(self.queue) >= 4:
                  # 取出前 4 位排队玩家进行撮合
                  batch = [self.queue.pop(0) for _ in range(4)]
                  match_id = str(uuid.uuid4())
                  seed = f"seed_{random.randint(100000, 999999)}"
                  
                  participants = {
                      item["user_id"]: {"day": 0, "assets": 30000.0, "is_finished": False}
                      for item in batch
                  }
                  
                  self.matches[match_id] = {
                      "seed": seed,
                      "participants": participants
                  }

                  # 建立用户到房间的双向映射，并发通知
                  for item in batch:
                      uid = item["user_id"]
                      self.user_to_match[uid] = match_id
                      ws = self.active_connections.get(uid)
                      if ws:
                          await ws.send_json({
                              "type": "MATCH_FOUND",
                              "match_id": match_id,
                              "match_seed": seed,
                              "players": list(participants.keys())
                          })
  ```

- [x] **Step 2: 建立 WebSockets 路由节点**
  监听连接并转发事件。
  写入 `backend/app/api/endpoints/pvp.py`：
  ```python
  import json
  from fastapi import APIRouter, WebSocket, WebSocketDisconnect
  from app.services.pvp_manager import PVPManager

  router = APIRouter()
  pvp_manager = PVPManager()

  @router.websocket("/ws/{user_id}")
  async def websocket_endpoint(websocket: WebSocket, user_id: str):
      await pvp_manager.register_connection(user_id, websocket)
      try:
          while True:
              data = await websocket.receive_text()
              event = json.loads(data)
              action = event.get("action")
              
              if action == "join_queue":
                  elo = event.get("elo", 1200)
                  pvp_manager.join_queue(user_id, elo)
                  await websocket.send_json({"type": "QUEUE_JOINED"})
                  
              elif action == "update_status":
                  # 更新局内天数和资产
                  match_id = pvp_manager.user_to_match.get(user_id)
                  if match_id and match_id in pvp_manager.matches:
                      day = event.get("day", 1)
                      assets = event.get("assets", 30000.0)
                      is_finished = event.get("is_finished", False)
                      
                      # 更新内存缓存
                      p_data = pvp_manager.matches[match_id]["participants"][user_id]
                      p_data["day"] = day
                      p_data["assets"] = assets
                      p_data["is_finished"] = is_finished
                      
                      # 广播给同房其他人
                      await pvp_manager.broadcast_to_match(match_id, {
                          "type": "OPPONENT_UPDATE",
                          "user_id": user_id,
                          "day": day,
                          "assets": assets,
                          "is_finished": is_finished
                      })
      except WebSocketDisconnect:
          pvp_manager.unregister_connection(user_id)
  ```

- [x] **Step 3: 将 WebSocket 路由节点挂载至总路由中，并启动匹配轮询任务**
  修改 `backend/main.py` 在启动时运行守护任务：
  ```python
  import asyncio
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from app.core.config import settings
  from app.api.router import api_router
  from app.api.endpoints.pvp import router as pvp_ws_router, pvp_manager

  app = FastAPI(title=settings.PROJECT_NAME)

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  app.include_router(api_router, prefix="/api/v1")
  app.include_router(pvp_ws_router, prefix="/pvp")

  @app.on_event("startup")
  async def startup_event():
      # 开启后台匹配轮询协程
      asyncio.create_task(pvp_manager.poll_matchmaking())
  ```

- [x] **Step 4: 编写 WebSockets 匹配测试用例**
  创建并写入 `backend/tests/test_pvp.py`：
  ```python
  import pytest
  from fastapi.testclient import TestClient
  from main import app

  def test_websocket_matchmaking():
      client = TestClient(app)
      # 模拟 4 个客户端连接
      with client.websocket_connect("/pvp/ws/user_a") as ws_a, \
           client.websocket_connect("/pvp/ws/user_b") as ws_b, \
           client.websocket_connect("/pvp/ws/user_c") as ws_c, \
           client.websocket_connect("/pvp/ws/user_d") as ws_d:
           
          # 四人排队
          ws_a.send_json({"action": "join_queue", "elo": 1200})
          ws_b.send_json({"action": "join_queue", "elo": 1200})
          ws_c.send_json({"action": "join_queue", "elo": 1200})
          ws_d.send_json({"action": "join_queue", "elo": 1200})
          
          # 验证所有人都会收到匹配成功广播 (MATCH_FOUND)
          resp_a = ws_a.receive_json()
          assert resp_a["type"] in ["QUEUE_JOINED", "MATCH_FOUND"]
          
          # 等待广播
          found_match = False
          for _ in range(5):
              msg = ws_a.receive_json()
              if msg["type"] == "MATCH_FOUND":
                  found_match = True
                  assert len(msg["players"]) == 4
                  break
          assert found_match is True
  ```

- [x] **Step 5: 运行 WebSocket 测试**
  在终端中运行：
  `pytest backend/tests/test_pvp.py -v`
  预期输出：PVP 匹配单元测试通过。

---

### Task 2: 前端开发 PVP 竞技看板组件与连接池管理

**Files:**
- Create: `frontend/src/components/PVPMonitor.jsx`
- Modify: `frontend/src/App.jsx`

- [x] **Step 1: 实现联机对手看板组件 (PVPMonitor)**
  通过条形图进度条展示所有匹配对手当前的关卡进度（Day 1-15）与资产变化。
  写入 `frontend/src/components/PVPMonitor.jsx`：
  ```jsx
  import React from 'react';

  export default function PVPMonitor({ opponentList }) {
      return (
          <div className="glass-card" style={{ padding: '15px', position: 'fixed', bottom: '20px', right: '20px', width: '260px', zIndex: 1000 }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>📡 PVP 局内看板</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(opponentList).map(([uid, data]) => {
                      const progressPercent = (data.day / 15) * 100;
                      return (
                          <div key={uid} style={{ fontSize: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                  <span>{uid.substring(0, 8)}...</span>
                                  <span style={{ fontWeight: 'bold' }}>¥{data.assets.toFixed(0)}</span>
                              </div>
                              <div style={{ background: '#333', height: '6px', borderRadius: '3px', position: 'relative' }}>
                                  <div
                                      style={{
                                          width: `${progressPercent}%`,
                                          background: data.is_finished ? 'var(--neon-green)' : '#00b0ff',
                                          height: '100%',
                                          borderRadius: '3px',
                                          transition: 'width 0.3s ease'
                                      }}
                                  />
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--text-gray)', textAlign: 'right', marginTop: '2px' }}>
                                  {data.is_finished ? "已完赛" : `进行至 Day ${data.day}`}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  }
  ```

- [x] **Step 2: 在主页面接入 WebSocket 连接与状态同步**
  修改 `frontend/src/App.jsx` 以开启联机匹配，监听对手事件：
  ```jsx
  import React, { useState, useEffect, useRef } from 'react';
  import { useGameStore } from './store/useGameStore';
  import { api } from './api/client';
  import KLineChart from './components/KLineChart';
  import StockRow from './components/StockRow';
  import PVPMonitor from './components/PVPMonitor';

  export default function App() {
      const store = useGameStore();
      const [userId, setUserId] = useState('player_' + Math.random().toString(36).substr(2, 5));
      const [username, setUsername] = useState('天梯大牛');
      const [mockPrice, setMockPrice] = useState(10.0);
      const [opponents, setOpponents] = useState({});
      const [isMatching, setIsMatching] = useState(false);
      const wsRef = useRef(null);

      // 初始化连接 WebSocket
      const startMatchmaking = () => {
          setIsMatching(true);
          const socket = new WebSocket(`ws://localhost:8000/pvp/ws/${userId}`);
          wsRef.current = socket;

          socket.onopen = () => {
              socket.send(JSON.stringify({ action: "join_queue", elo: store.user?.elo_rating || 1200 }));
          };

          socket.onmessage = (event) => {
              const msg = JSON.parse(event.data);
              
              if (msg.type === "MATCH_FOUND") {
                  setIsMatching(false);
                  store.startGame(msg.match_seed, "internet_worker");
                  // 初始化对手列表
                  const initOpp = {};
                  msg.players.forEach(p => {
                      if (p !== userId) {
                          initOpp[p] = { day: 0, assets: 30000.0, is_finished: False };
                      }
                  });
                  setOpponents(initOpp);
              } else if (msg.type === "OPPONENT_UPDATE") {
                  setOpponents(prev => ({
                      ...prev,
                      [msg.user_id]: { day: msg.day, assets: msg.assets, is_finished: msg.is_finished }
                  }));
              }
          };
      };

      // 本地进度发生改变时，自动将状态广播给房内对手
      useEffect(() => {
          if (store.isPlaying && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                  action: "update_status",
                  day: store.day,
                  assets: store.assets,
                  is_finished: store.day >= 15
              }));
          }
      }, [store.day, store.assets, store.isPlaying]);

      const handleLogin = async () => {
          const userData = await api.login(userId, username);
          store.setUser(userData);
      };

      if (!store.user) {
          return (
              <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }} className="glass-card">
                  <h2>股票人生模拟器 - 登录入口</h2>
                  <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="用户ID" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="角色昵称" style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
                  <button onClick={handleLogin} className="neon-btn-green" style={{ width: '100%' }}>以游客登录</button>
              </div>
          );
      }

      if (isMatching) {
          return (
              <div style={{ padding: '40px', maxWidth: '450px', margin: '100px auto', textAlign: 'center' }} className="glass-card">
                  <h3>🔍 正在搜寻实力相当的散户...</h3>
                  <p style={{ color: 'var(--text-gray)' }}>当前寻找 4 人天梯对局，请稍候</p>
                  <div className="loader" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid var(--neon-green)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '20px auto' }} />
                  <button className="neon-btn-green" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }} onClick={() => setIsMatching(false)}>取消匹配</button>
              </div>
          );
      }

      if (!store.isPlaying) {
          return (
              <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }} className="glass-card">
                  <h3>大厅首屏 - 天梯分: {store.user.elo_rating}</h3>
                  <button onClick={startMatchmaking} className="neon-btn-green" style={{ width: '100%', padding: '15px' }}>🚀 寻找 PVP 竞技赛 (Elo 匹配)</button>
              </div>
          );
      }

      return (
          <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
              <div className="glass-card" style={{ padding: '15px', marginBottom: '20px' }}>
                  <h3>竞技赛对局 - Day {store.day} / 15</h3>
                  <p>可用现金: ¥{store.cash.toFixed(2)} | 总资产: ¥{store.assets.toFixed(2)}</p>
                  <button className="neon-btn-green" onClick={() => store.nextDay(800, 200)}>操盘完毕，下一天</button>
              </div>

              <h3>看盘面板</h3>
              <StockRow
                  stockName="科技-01"
                  price={mockPrice}
                  holdingQty={store.holdings["科技-01"] || 0}
                  onTrade={(type, qty) => {
                      if (type === 'BUY') store.buyStock("科技-01", mockPrice, qty);
                      if (type === 'SELL') store.sellStock("科技-01", mockPrice, qty);
                  }}
              />

              {/* PVP 联机同步看板 */}
              <PVPMonitor opponentList={opponents} />
          </div>
      );
  }
  ```
