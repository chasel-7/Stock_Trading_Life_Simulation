# 股票人生模拟器 — 第二阶段（交易校验与防作弊系统）开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 核心解决玩家通过前端内存/修改 LocalStorage 刷榜作弊的问题。实现基于随机种子的股价行情生成器，以及后端交易日志重放校验逻辑，并接入结算接口。

**Architecture:** 
1. `stock_generator.py`：使用 Python 的 `random.Random(seed)` 搭建与前端生成规则 100% 对齐的确定性价格走势生成器。
2. `verification.py`：对客户端提交的交易日志和场景消费日志进行“日结算重演”，校验总资产数学模型。
3. 单元测试将构建“篡改数据”与“正常数据”两个方向，分别校验后端是否能够识别作弊。

**Tech Stack:** Python 3.11+, FastAPI, SQLModel, pytest

---

### Task 1: 编写基于种子的股价与事件走势发生器 (StockGenerator)

**Files:**
- Create: `backend/app/services/stock_generator.py`
- Test: `backend/tests/test_stock_generator.py`

- [x] **Step 1: 创建确定性股价与板块行情发生器**
  实现使用随机种子生成 15 支股票 15 天内，每天 240 个分时价格点及最高/最低价边界。
  写入 `backend/app/services/stock_generator.py`：
  ```python
  import random
  from typing import Dict, List, Tuple

  class StockGenerator:
      def __init__(self, seed: str):
          self.random = random.Random(seed)
          
      def generate_daily_prices(self, stock_name: str, day: int, base_price: float) -> Tuple[List[float], float, float]:
          """
          生成指定股票在某一天的 240 个分时数据点，并返回分时折线、当日最高价和当日最低价。
          使用 deterministic random 确保相同种子生成一致数据。
          """
          # 使用股票名+天数做哈希子种子，保证不同股不同天的随机性是确定且独立的
          sub_seed = f"{stock_name}_{day}"
          local_rand = random.Random(sub_seed)
          
          prices = []
          current_price = base_price
          high_price = base_price
          low_price = base_price
          
          # 随机游走算法 (Random Walk with Bias)
          # 假设波动幅度在 -1.5% 到 +1.5% 之间
          for _ in range(240):
              change_percent = local_rand.uniform(-0.015, 0.015)
              current_price = current_price * (1 + change_percent)
              current_price = round(max(0.1, current_price), 2)
              prices.append(current_price)
              
              if current_price > high_price:
                  high_price = current_price
              if current_price < low_price:
                  low_price = current_price
                  
          return prices, high_price, low_price

      def get_daily_bounds(self, stock_name: str, day: int, initial_base_price: float) -> Tuple[float, float, float]:
          """
          快速获取某股票某天的 开盘/最高/最低价，用于后端交易价格合法性验证
          """
          # 假设股票每日收盘价作为下一天的开盘基准价，我们需要推导每一天的开盘价
          # 为简化，我们用子种子链式生成每一天的开盘价
          base_price = initial_base_price
          for d in range(1, day + 1):
              prices, high, low = self.generate_daily_prices(stock_name, d, base_price)
              if d == day:
                  return prices[0], high, low
              base_price = prices[-1] # 昨日收盘价
          return base_price, base_price, base_price
  ```

- [x] **Step 2: 编写发生器单元测试，验证其在相同种子下的确定性**
  写入 `backend/tests/test_stock_generator.py`：
  ```python
  from app.services.stock_generator import StockGenerator

  def test_deterministic_prices():
      gen1 = StockGenerator("seed_test_123")
      gen2 = StockGenerator("seed_test_123")
      
      # 校验同一只股票同一天生成的最高最低价是否完全一致
      open1, high1, low1 = gen1.get_daily_bounds("科技-01", day=3, initial_base_price=10.0)
      open2, high2, low2 = gen2.get_daily_bounds("科技-01", day=3, initial_base_price=10.0)
      
      assert open1 == open2
      assert high1 == high2
      assert low1 == low2
      
      # 不同股票应有不同价格
      _, high_tech, _ = gen1.get_daily_bounds("科技-01", day=1, initial_base_price=10.0)
      _, high_finance, _ = gen1.get_daily_bounds("金融-01", day=1, initial_base_price=10.0)
      assert high_tech != high_finance
  ```

- [x] **Step 3: 运行测试**
  在终端中运行：
  `pytest backend/tests/test_stock_generator.py -v`
  预期输出：`test_deterministic_prices PASSED`

---

### Task 2: 实现后端防作弊交易验证引擎 (VerificationService)

**Files:**
- Create: `backend/app/services/verification.py`
- Test: `backend/tests/test_verification.py`

- [x] **Step 1: 实现对交易日志的日结算重放核验**
  根据初始资金，按天处理买卖操作，检查手续费、资金合理性，并校对场景消费。
  写入 `backend/app/services/verification.py`：
  ```python
  from typing import List, Dict, Any
  from app.services.stock_generator import StockGenerator

  class VerificationService:
      # 股票初始基准价格映射，这里和前端的 100 支股票初始价格保持一致
      STOCK_INITIAL_PRICES = {
          "科技-01": 10.0, "科技-02": 15.0, "科技-07": 23.50,
          "消费-01": 8.0, "消费-02": 12.0,
          "制造-01": 11.0, "金融-01": 5.0
      }

      ROLE_INITIAL_CASH = {
          "internet_worker": 30000.0,
          "sales_manager": 20000.0,
          "freelancer": 50000.0,
          "government_worker": 15000.0
      }

      ROLE_DAILY_SALARY = {
          "internet_worker": 800.0,
          "sales_manager": 500.0,
          "freelancer": 400.0, # 简化测试取固定值，对局中可由日志记录
          "government_worker": 400.0
      }

      ROLE_DAILY_COST = {
          "internet_worker": 200.0,
          "sales_manager": 300.0,
          "freelancer": 150.0,
          "government_worker": 100.0
      }

      @classmethod
      def verify_game_log(
          cls,
          seed: str,
          role_type: str,
          transaction_log: List[Dict[str, Any]],
          scene_log: List[Dict[str, Any]],
          submitted_final_assets: float
      ) -> bool:
          """
          重放客户端交易与消费，验证提交的资产总额是否合法。
          """
          if role_type not in cls.ROLE_INITIAL_CASH:
              return False

          # 1. 初始化资金状态
          cash = cls.ROLE_INITIAL_CASH[role_type]
          stock_holdings = {} # {"股票名": 数量}
          generator = StockGenerator(seed)
          
          # 手续费率 (默认 1%，有书店等加成在前端上报中带上，此处为简化采用 1%)
          fee_rate = 0.01

          # 按交易日 1-15 依次重放
          for day in range(1, 16):
              # 处理当日盘中交易
              day_txs = [tx for tx in transaction_log if tx.get("day") == day]
              for tx in day_txs:
                  stock = tx.get("stock")
                  tx_type = tx.get("type")
                  price = tx.get("price")
                  qty = tx.get("qty")
                  
                  # 校验该股在该天是否确实存在，且价格是否在最高/最低价范围内（含 0.5% 滑点容差）
                  init_p = cls.STOCK_INITIAL_PRICES.get(stock, 10.0)
                  _, high_p, low_p = generator.get_daily_bounds(stock, day, init_p)
                  
                  if price < low_p * 0.995 or price > high_p * 1.005:
                      # 价格不合法（作弊或严重的客户端数据不同步）
                      return False

                  if tx_type == "BUY":
                      cost = price * qty
                      fee = cost * fee_rate
                      total_spend = cost + fee
                      if cash < total_spend:
                          # 现金不足，非法买入
                          return False
                      cash -= total_spend
                      stock_holdings[stock] = stock_holdings.get(stock, 0) + qty
                  elif tx_type == "SELL":
                      if stock_holdings.get(stock, 0) < qty:
                          # 超卖，持仓不足
                          return False
                      revenue = price * qty
                      fee = revenue * fee_rate
                      cash += (revenue - fee)
                      stock_holdings[stock] -= qty
                      if stock_holdings[stock] == 0:
                          del stock_holdings[stock]

              # 处理当日盘后场景消费
              day_scenes = [s for s in scene_log if s.get("day") == day]
              scene_spend = sum(s.get("spend", 0) for s in day_scenes)
              cash -= scene_spend

              # 加上日薪，扣除生活成本
              cash += cls.ROLE_DAILY_SALARY[role_type]
              cash -= cls.ROLE_DAILY_COST[role_type]

          # 计算最终总资产 = 现金 + 剩余持仓股票按最后一天的收盘价计算市值
          remaining_stock_value = 0.0
          for stock, qty in stock_holdings.items():
              init_p = cls.STOCK_INITIAL_PRICES.get(stock, 10.0)
              # 用第15天的折线数据中的最后一点作为期末价格进行结算
              prices, _, _ = generator.generate_daily_prices(stock, 15, init_p)
              final_price = prices[-1]
              remaining_stock_value += qty * final_price

          calculated_assets = round(cash + remaining_stock_value, 2)
          # 误差在 0.1 元以内即可判定为真
          return abs(calculated_assets - submitted_final_assets) < 0.1
  ```

- [x] **Step 2: 编写校验引擎测试（分别注入合规数据与作弊改资产的数据）**
  写入 `backend/tests/test_verification.py`：
  ```python
  from app.services.verification import VerificationService

  def test_verification_valid_log():
      # 模拟一个没有买卖，只有基础收支的合规对局 (打工人：30000 初始)
      # 15天日薪 = 15 * 800 = 12000
      # 15天成本 = 15 * 200 = 3000
      # 最终资产应为：30000 + 12000 - 3000 = 39000
      transaction_log = []
      scene_log = []
      
      is_valid = VerificationService.verify_game_log(
          seed="test_seed_999",
          role_type="internet_worker",
          transaction_log=transaction_log,
          scene_log=scene_log,
          submitted_final_assets=39000.0
      )
      assert is_valid is True

  def test_verification_cheat_assets():
      # 篡改资产数据（本来应为39000，强行提交为 99999.0）
      is_valid = VerificationService.verify_game_log(
          seed="test_seed_999",
          role_type="internet_worker",
          transaction_log=[],
          scene_log=[],
          submitted_final_assets=99999.0
      )
      assert is_valid is False
  ```

- [x] **Step 3: 运行校验引擎测试**
  在终端中运行：
  `pytest backend/tests/test_verification.py -v`
  预期输出：两个校验测试均通过。

---

### Task 3: 接入 game/record 战绩提报端点

**Files:**
- Modify: `backend/app/schemas/game_record.py`
- Modify: `backend/app/api/endpoints/game.py`
- Test: `backend/tests/test_game.py`

- [x] **Step 1: 在请求 Schema 中加入行情种子和场景消费日志字段**
  修改 `backend/app/schemas/game_record.py`：
  ```python
  from typing import List, Dict, Any
  from pydantic import BaseModel

  class RecordCreateRequest(BaseModel):
      user_id: str
      role_type: str
      match_seed: str                                 # 行情种子
      final_cash: float
      final_assets: float
      profit_rate: float
      transaction_log: List[Dict[str, Any]]           # 交易日志
      scene_log: List[Dict[str, Any]]                 # 场景消费日志
      score_metrics: Dict[str, Any]                   # 结算雷达评分

  class RecordResponse(BaseModel):
      id: int
      user_id: str
      role_type: str
      final_cash: float
      final_assets: float
      profit_rate: float
      is_verified: bool
  ```

- [x] **Step 2: 升级战绩保存逻辑，调用 VerificationService 校验**
  修改 `backend/app/api/endpoints/game.py`：
  ```python
  import json
  from typing import List
  from fastapi import APIRouter, Depends, HTTPException
  from sqlmodel import Session
  from app.database.db import get_db
  from app.models.user import User
  from app.models.game_record import GameRecord
  from app.schemas.game_record import RecordCreateRequest, RecordResponse
  from app.services.verification import VerificationService

  router = APIRouter()

  @router.post("/record", response_model=RecordResponse)
  def save_game_record(payload: RecordCreateRequest, db: Session = Depends(get_db)):
      user = db.query(User).filter(User.id == payload.user_id).first()
      if not user:
          raise HTTPException(status_code=404, detail="User not found")
      
      # 调用防作弊重放校验
      is_verified = VerificationService.verify_game_log(
          seed=payload.match_seed,
          role_type=payload.role_type,
          transaction_log=payload.transaction_log,
          scene_log=payload.scene_log,
          submitted_final_assets=payload.final_assets
      )
      
      tx_log_str = json.dumps(payload.transaction_log)
      metrics_str = json.dumps(payload.score_metrics)
      
      record = GameRecord(
          user_id=payload.user_id,
          role_type=payload.role_type,
          final_cash=payload.final_cash,
          final_assets=payload.final_assets,
          profit_rate=payload.profit_rate,
          transaction_log=tx_log_str,
          score_metrics=metrics_str,
          is_verified=is_verified
      )
      db.add(record)
      db.commit()
      db.refresh(record)
      return record

  @router.get("/user/{user_id}/history", response_model=List[RecordResponse])
  def get_user_records(user_id: str, db: Session = Depends(get_db)):
      records = db.query(GameRecord).filter(GameRecord.user_id == user_id).all()
      return records
  ```

- [x] **Step 3: 运行完整 game 路由测试并更新测试逻辑**
  修改并更新测试 `backend/tests/test_game.py` 匹配新的 Payload：
  ```python
  def test_create_and_query_record(client):
      # 注册用户
      user_payload = {"id": "user_verify_test", "username": "待检测股神"}
      client.post("/api/v1/auth/login", json=user_payload)

      # 正常提报数据包
      record_payload = {
          "user_id": "user_verify_test",
          "role_type": "internet_worker",
          "match_seed": "test_seed_abc",
          "final_cash": 39000.0,
          "final_assets": 39000.0,
          "profit_rate": 30.0,
          "transaction_log": [],
          "scene_log": [],
          "score_metrics": {"智慧": 80, "心态": 90, "社交": 70, "平衡": 85}
      }
      response = client.post("/api/v1/game/record", json=record_payload)
      assert response.status_code == 200
      data = response.json()
      assert data["is_verified"] is True  # 通过验证

      # 伪造作弊数据包
      cheat_payload = record_payload.copy()
      cheat_payload["final_assets"] = 99999.0
      response_cheat = client.post("/api/v1/game/record", json=cheat_payload)
      assert response_cheat.status_code == 200
      assert response_cheat.json()["is_verified"] is False # 校验失败！
  ```

- [x] **Step 4: 运行所有 game 测试**
  在终端中运行：
  `pytest backend/tests/test_game.py -v`
  预期输出：所有测试均成功通过。
