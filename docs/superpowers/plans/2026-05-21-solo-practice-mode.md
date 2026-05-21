# 单人练习赛模式 (Practice Mode) 开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 实现单人离线练习赛模式，在该模式下，玩家不需要通过 WebSocket 匹配直接在本地使用随机种子开启游戏，完赛后战绩保存至数据库但不更改天梯 Elo 评分。

**Architecture:** 
1. 后端修改 `GameRecord` DB Model 与 API Payload 增加 `is_practice` 字段，并在数据库初始化时对旧表字段进行 DDL 扩充升级；
2. 更改 `/record` 接口，若为练习赛，则跳过修改 Elo 积分的操作；
3. 前端 Zustand store 状态增加 `isPvpMode` 开关并在 `startGame` 初始化；
4. 调整前端大厅 UI 与结算 UI，并更新历史战绩显示，将练习赛模式的看板隐藏并增加专属结算信息。

**Tech Stack:** React (Vite), Zustand, FastAPI, SQLModel (SQLite)

---

### Task 1: 后端数据库结构扩充与字段迁移

**Files:**
- Modify: [game_record.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/models/game_record.py)
- Modify: [db.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/database/db.py)
- Test: [test_db.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/tests/test_db.py)

- [x] **Step 1: 在 `test_db.py` 中编写对 `is_practice` 新增字段是否存在且默认正确的单元测试**

  修改 [test_db.py:L1-L10](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/tests/test_db.py#L1-L10) 添加测试：
  ```python
  def test_game_record_practice_field(db):
      from app.models.game_record import GameRecord
      # 测试能否正常创建含有 is_practice 的记录且默认为 False
      record = GameRecord(
          user_id="test_user_id",
          role_type="internet_worker",
          match_seed="test_seed",
          final_cash=30000.0,
          final_assets=30000.0,
          profit_rate=0.0,
          transaction_log="[]",
          score_metrics="{}"
      )
      db.add(record)
      db.commit()
      db.refresh(record)
      assert record.is_practice is False
  ```

- [x] **Step 2: 运行测试并确保其失败（在修改代码前）**

  Run: `pytest backend/tests/test_db.py -k test_game_record_practice_field`
  Expected: FAIL (AttributeError: 'GameRecord' object has no attribute 'is_practice' 或类似错误)

- [x] **Step 3: 修改 `game_record.py` 的 `GameRecord` 模型与 `db.py` 补充 DDL 迁移兼容逻辑**

  在 [game_record.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/models/game_record.py) 中，在 `created_at` 字段前追加 `is_practice` 字段：
  ```python
      is_practice: bool = Field(default=False)         # 是否为单人练习赛
  ```
  在 [db.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/database/db.py) 的 `init_db` 中，在 `SQLModel.metadata.create_all(engine)` 后添加数据库平滑升级代码：
  ```python
  def init_db():
      from app.models.user import User
      from app.models.game_record import GameRecord
      SQLModel.metadata.create_all(engine)
      
      from sqlalchemy import text, inspect
      inspector = inspect(engine)
      columns = [col['name'] for col in inspector.get_columns('game_records')]
      if 'is_practice' not in columns:
          with engine.connect() as conn:
              conn.execute(text("ALTER TABLE game_records ADD COLUMN is_practice BOOLEAN DEFAULT 0"))
              conn.commit()
  ```

- [x] **Step 4: 运行测试并确认其通过**

  Run: `pytest backend/tests/test_db.py`
  Expected: PASS

- [x] **Step 5: 提交更改到 Git**

  ```bash
  git add backend/app/models/game_record.py backend/app/database/db.py backend/tests/test_db.py
  git commit -m "feat: add is_practice field to game_records table with DDL migration support"
  ```

---

### Task 2: 后端 Pydantic Schemas 修改

**Files:**
- Modify: [game_record.py (Schemas)](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/schemas/game_record.py)

- [x] **Step 1: 在 `RecordCreateRequest` 与 `RecordResponse` 中添加 `is_practice` 字段**

  在 [game_record.py (Schemas):L5-L26](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/schemas/game_record.py#L5-L26) 中修改：
  ```python
  class RecordCreateRequest(BaseModel):
      user_id: str
      role_type: str
      match_seed: str
      final_cash: float
      final_assets: float
      profit_rate: float
      transaction_log: List[Dict[str, Any]]
      scene_log: List[Dict[str, Any]]
      score_metrics: Dict[str, Any]
      is_practice: Optional[bool] = False  # 新增：标记是否为单机练习赛

  class RecordResponse(BaseModel):
      id: int
      user_id: str
      role_type: str
      match_seed: str
      final_cash: float
      final_assets: float
      profit_rate: float
      is_verified: bool
      is_practice: bool  # 新增：返回练习赛标记
      created_at: datetime
  ```

- [x] **Step 2: 运行现有接口集成测试验证 Schema 对齐**

  Run: `pytest backend/tests/test_game.py`
  Expected: PASS (旧数据默认返回 is_practice=False 校验成功)

- [x] **Step 3: 提交更改到 Git**

  ```bash
  git add backend/app/schemas/game_record.py
  git commit -m "feat: update Record schemas to support is_practice field"
  ```

---

### Task 3: 后端完赛记录提交接口积分变更隔离

**Files:**
- Modify: [game.py (Endpoints)](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/api/endpoints/game.py)
- Modify: [test_game.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/tests/test_game.py)

- [x] **Step 1: 在 `test_game.py` 中编写提交练习赛对局后天梯 ELO 分数保持不变的测试用例**

  在 [test_game.py](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/tests/test_game.py) 底部添加测试方法：
  ```python
  def test_practice_record_submission(client):
      # 1. 正常注册用户，初始 ELO 默认为 1200
      user_payload = {"id": "practice_player_123", "username": "练习生"}
      client.post("/api/v1/auth/login", json=user_payload)

      # 2. 提交练习赛记录 (is_practice=True, 即使收益率高 ELO 也不应变化)
      record_payload = {
          "user_id": "practice_player_123",
          "role_type": "internet_worker",
          "match_seed": "practice_seed_999",
          "final_cash": 39000.0,
          "final_assets": 39000.0,
          "profit_rate": 30.0,
          "transaction_log": [],
          "scene_log": [],
          "score_metrics": {"智慧": 80, "心态": 90, "社交": 70, "平衡": 85},
          "is_practice": True
      }
      response = client.post("/api/v1/game/record", json=record_payload)
      assert response.status_code == 200
      data = response.json()
      assert data["is_practice"] is True

      # 3. 验证该用户的积分没有变化，依然为 1200
      response_user = client.post("/api/v1/auth/login", json=user_payload)
      assert response_user.json()["elo_rating"] == 1200
  ```

- [x] **Step 2: 运行测试并确保其失败（ELO 分数不应提升）**

  Run: `pytest backend/tests/test_game.py -k test_practice_record_submission`
  Expected: FAIL (elo_rating == 1230, which violates elo_rating == 1200)

- [x] **Step 3: 修改 `save_game_record` 接口，隔离练习赛的 ELO 积分计算并正确填充 DB**

  修改 [game.py (Endpoints):L15-L60](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/backend/app/api/endpoints/game.py#L15-L60):
  ```python
  @router.post("/record", response_model=RecordResponse)
  def save_game_record(payload: RecordCreateRequest, db: Session = Depends(get_db)):
      # 验证用户是否存在
      user = db.query(User).filter(User.id == payload.user_id).first()
      if not user:
          raise HTTPException(status_code=404, detail="User not found")
      
      # 进行重放验证
      is_verified = VerificationService.verify_game_log(
          seed=payload.match_seed,
          role_type=payload.role_type,
          transaction_log=payload.transaction_log,
          scene_log=payload.scene_log,
          submitted_final_assets=payload.final_assets,
          submitted_score_metrics=payload.score_metrics
      )
      
      # 仅非练习赛进行天梯 Elo 变更
      if not payload.is_practice:
          if is_verified:
              # 验证通过：依据收益率计算积分增量
              rating_change = max(-50, min(100, int(payload.profit_rate)))
              user.elo_rating = max(100, user.elo_rating + rating_change)
          else:
              # 验证不通过（作弊）：直接扣除 100 积分
              user.elo_rating = max(100, user.elo_rating - 100)
      
      tx_log_str = json.dumps(payload.transaction_log)
      score_metrics_str = json.dumps(payload.score_metrics)
      
      record = GameRecord(
          user_id=payload.user_id,
          role_type=payload.role_type,
          match_seed=payload.match_seed,
          final_cash=payload.final_cash,
          final_assets=payload.final_assets,
          profit_rate=payload.profit_rate,
          transaction_log=tx_log_str,
          score_metrics=score_metrics_str,
          is_verified=is_verified,
          is_practice=payload.is_practice  # 保存单人练习赛标记到数据库
      )
      db.add(record)
      db.add(user)
      db.commit()
      db.refresh(record)
      db.refresh(user)
      return record
  ```

- [x] **Step 4: 运行所有后端测试，确认全数通过**

  Run: `pytest backend/tests/`
  Expected: PASS

- [x] **Step 5: 提交更改到 Git**

  ```bash
  git add backend/app/api/endpoints/game.py backend/tests/test_game.py
  git commit -m "feat: ignore Elo rating change and save practice flag in save_game_record endpoint"
  ```

---

### Task 4: 前端 Zustand 游戏状态扩充

**Files:**
- Modify: [useGameStore.js](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/store/useGameStore.js)

- [x] **Step 1: 在 `useGameStore.js` 中增加 `isPvpMode` 状态，并调整 `startGame` 进行初始化**

  修改 [useGameStore.js:L15-L79](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/store/useGameStore.js#L15-L79):
  - 属性初始化中增加：
    ```javascript
    isPvpMode: false,
    ```
  - 修改 `startGame` 方法，添加 `isPvp = false` 形参并设置属性值：
    ```javascript
        startGame: (seed, role, isPvp = false) => {
            let initialCash = 30000.0;
            if (role === "sales_manager") initialCash = 20000.0;
            if (role === "freelancer") initialCash = 50000.0;
            if (role === "government_worker") initialCash = 15000.0;

            set({
                isPlaying: true,
                isPvpMode: isPvp,
                day: 1,
                cash: initialCash,
                assets: initialCash,
                holdings: {},
                avgHoldCosts: {},
                transactionLog: [],
                sceneLog: [],
                matchSeed: seed,
                roleType: role,
                bookstoreDaysLeft: 0,
                liquidationStrategy: "profit_first",
                gatheredInfo: [],
                pendingRepayments: [],
                tickRateMultiplier: 1.0,
                dailyPricesHistory: {},
                hasLiquidated: false,
                meetingForceEnd: false
            });
        },
    ```

- [x] **Step 2: 提交更改到 Git**

  ```bash
  git add frontend/src/store/useGameStore.js
  git commit -m "feat: expand Zustand store to support isPvpMode state flag"
  ```

---

### Task 5: 前端大厅 UI 与练习赛启动流程开发

**Files:**
- Modify: [App.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx)

- [x] **Step 1: 修改大厅匹配成功时调用 `store.startGame` 传参为 `true` 表示 PVP 模式**

  修改 [App.jsx:L294](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L294)：
  ```javascript
  store.startGame(msg.match_seed, selectedRole, true);
  ```

- [x] **Step 2: 在大厅首屏增加单机练习赛按钮，并绑定启动行为**

  修改 [App.jsx:L682-L685](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L682-L685)（在大厅寻找 PVP 按钮下方）：
  ```javascript
                  <button onClick={startMatchmaking} className="neon-btn-green" style={{ width: '100%', padding: '15px' }}>🚀 寻找 PVP 竞技赛 (Elo 匹配)</button>
                  <button 
                      onClick={() => {
                          const seed = 'practice_' + Math.random().toString(36).substr(2, 9);
                          let initialCash = 30000.0;
                          if (selectedRole === "sales_manager") initialCash = 20000.0;
                          if (selectedRole === "freelancer") initialCash = 50000.0;
                          if (selectedRole === "government_worker") initialCash = 15000.0;

                          setStartOfDayAssets(initialCash);
                          store.startGame(seed, selectedRole, false);
                          setPhase('TRADE');
                          setOpponents({});
                      }} 
                      className="neon-btn-green" 
                      style={{ width: '100%', padding: '15px', marginTop: '12px', borderColor: '#00b0ff', color: '#00b0ff' }}
                  >
                      🎮 开启单人练习赛 (不计天梯分)
                  </button>
  ```

- [x] **Step 3: 提交更改到 Git**

  ```bash
  git add frontend/src/App.jsx
  git commit -m "feat: add single-player practice match button to lobby UI"
  ```

---

### Task 6: 局内操盘界面 PVP 监视器隐藏与标题切换

**Files:**
- Modify: [App.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx)

- [x] **Step 1: 使 `PVPMonitor` 渲染逻辑受 `isPvpMode` 控制，并切换操盘头部标题**

  修改 [App.jsx:L719](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L719):
  ```javascript
  <h3 style={{ margin: '0 0 5px 0' }}>{store.isPvpMode ? "竞技赛对局" : "单人模拟对局"} - Day {store.day} / 15</h3>
  ```
  修改 [App.jsx:L1116](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L1116) (底部组件渲染逻辑):
  ```javascript
              {/* PVP 联机同步看板 */}
              {phase !== 'SETTLEMENT' && store.isPvpMode && <PVPMonitor opponentList={opponents} />}
  ```

- [x] **Step 2: 提交更改到 Git**

  ```bash
  git add frontend/src/App.jsx
  git commit -m "feat: toggle trading headers and hide PVPMonitor sidebar in practice mode"
  ```

---

### Task 7: 结算界面与历史记录列表标签分类

**Files:**
- Modify: [App.jsx](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx)

- [x] **Step 1: 上报战绩时包含练习赛标志，并定制结算信息与历史战绩分类展示**

  修改 [App.jsx:L525-L541](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L525-L541) (提交记录处)：
  ```javascript
          const recordData = {
              user_id: store.user.id,
              role_type: store.roleType,
              match_seed: store.matchSeed,
              final_cash: isBankrupt ? 0.0 : store.cash,
              final_assets: finalAssets,
              profit_rate: profitRate,
              transaction_log: store.transactionLog,
              scene_log: store.sceneLog,
              score_metrics: {
                  "智慧": metrics["投资智慧"],
                  "心态": metrics["心态稳定"],
                  "社交": metrics["社交回报"],
                  "平衡": metrics["生活平衡"]
              },
              is_practice: !store.isPvpMode
          };
  ```
  修改 [App.jsx:L882](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L882) 结算标题：
  ```javascript
  <h2 style={{ color: 'var(--neon-green)', marginBottom: '5px' }}>{store.isPvpMode ? "🏆 竞技赛终局对局结算" : "🏆 练习赛终局对局结算"}</h2>
  ```
  修改 [App.jsx:L903-L916](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L903-L916) (Elo 积分卡片展示逻辑)：
  ```javascript
                              {/* ELO Rating Badge */}
                              {store.isPvpMode ? (
                                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>天梯积分变动 (Elo)</div>
                                          <div style={{ fontSize: '13px', marginTop: '2px' }}>
                                              {settlementReport.oldElo} ➔ <span style={{ fontWeight: 'bold' }}>{settlementReport.newElo}</span>
                                          </div>
                                      </div>
                                      <div 
                                          className="elo-change-badge" 
                                          style={{ color: settlementReport.eloDiff >= 0 ? 'var(--neon-green)' : 'var(--neon-red)', fontSize: '20px', fontWeight: 'bold' }}
                                      >
                                          {settlementReport.eloDiff >= 0 ? `+${settlementReport.eloDiff}` : settlementReport.eloDiff}
                                      </div>
                                  </div>
                              ) : (
                                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>天梯积分变动 (Elo)</div>
                                      <div style={{ fontSize: '13px', marginTop: '4px', color: 'var(--neon-yellow)', fontWeight: 'bold' }}>
                                          本局为单人练习赛，不计天梯积分
                                      </div>
                                  </div>
                              )}
  ```
  修改 [App.jsx:L919-L920](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L919-L920) 排行榜表头：
  ```javascript
                              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                  {store.isPvpMode ? "🏁 本场对局排行" : "🏁 终局资产结算"}
                              </h4>
  ```
  修改 [App.jsx:L691](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/frontend/src/App.jsx#L691) 历史战绩展示分类：
  ```javascript
  #{record.id} | {record.is_practice ? "[练习]" : "[竞技]"} | 职业: {ROLE_OPTIONS.find(r => r.id === record.role_type)?.name || record.role_type} | 资产: ¥{record.final_assets.toFixed(0)} | 收益: {record.profit_rate.toFixed(1)}% | {record.is_verified ? "验证通过" : "拒绝交易"}
  ```

- [x] **Step 2: 提交更改到 Git**

  ```bash
  git add frontend/src/App.jsx
  git commit -m "feat: complete settlement UI differences and history type tag labeling for practice matches"
  ```
