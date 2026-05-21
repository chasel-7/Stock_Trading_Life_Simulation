# 股票人生模拟器 — 第一阶段（后端基础与ORM表设计）开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 Python FastAPI + SQLite 后端骨架，实现数据库 ORM 映射（用户与历史战绩表），以及游客/微信登录与基础战绩保存接口，并实现 TDD 自动化测试验证。

**Architecture:** 
采用模块化单体架构。通过 SQLModel (结合了 SQLAlchemy 与 Pydantic 的现代化库) 来定义数据库实体与接口数据校验。在内存/临时 SQLite 文件中运行单元测试，通过 FastAPI TestClient 验证路由正确性。

**Tech Stack:** Python 3.11+, FastAPI, SQLModel, Uvicorn, pytest, httpx

---

### Task 1: 搭建后端开发环境与应用骨架

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/api/router.py`
- Test: `backend/tests/conftest.py`

- [x] **Step 1: 创建依赖声明文件**
  写入 `backend/requirements.txt`：
  ```text
  fastapi>=0.110.0
  sqlmodel>=0.0.16
  uvicorn>=0.28.0
  pytest>=8.0.0
  httpx>=0.27.0
  ```

- [x] **Step 2: 创建核心配置模块**
  写入 `backend/app/core/config.py`：
  ```python
  import os
  from pydantic_settings import BaseSettings

  class Settings(BaseSettings):
      PROJECT_NAME: str = "Stock Life Simulator API"
      DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./stock_life.db")
      SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
      ALGORITHM: str = "HS256"

  settings = Settings()
  ```

- [x] **Step 3: 创建主 API 路由聚合**
  写入 `backend/app/api/router.py`：
  ```python
  from fastapi import APIRouter

  api_router = APIRouter()

  @api_router.get("/health", tags=["health"])
  def health_check():
      return {"status": "ok", "message": "Stock Life Simulator API is healthy"}
  ```

- [x] **Step 4: 创建应用入口**
  写入 `backend/main.py`：
  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  from app.core.config import settings
  from app.api.router import api_router

  app = FastAPI(title=settings.PROJECT_NAME)

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  app.include_router(api_router, prefix="/api/v1")
  ```

- [x] **Step 5: 编写环境初始化与第一个健康检查单元测试**
  写入 `backend/tests/conftest.py`：
  ```python
  import pytest
  from fastapi.testclient import TestClient
  from main import app

  @pytest.fixture(name="client")
  def client_fixture():
      with TestClient(app) as client:
          yield client
  ```
  创建并写入测试 `backend/tests/test_health.py`：
  ```python
  def test_health_check(client):
      response = client.get("/api/v1/health")
      assert response.status_code == 200
      assert response.json() == {"status": "ok", "message": "Stock Life Simulator API is healthy"}
  ```

- [x] **Step 6: 验证骨架测试通过**
  在终端中运行：
  `pytest backend/tests/test_health.py -v`
  预期输出：`test_health_check PASSED`

---

### Task 2: 实现数据库连接与 SQLModel ORM 实体设计

**Files:**
- Create: `backend/app/database/db.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/game_record.py`
- Modify: `backend/tests/conftest.py`
- Test: `backend/tests/test_db.py`

- [x] **Step 1: 创建数据库初始化引擎与依赖**
  写入 `backend/app/database/db.py`：
  ```python
  from sqlmodel import SQLModel, create_engine, Session
  from app.core.config import settings

  connect_args = {"check_same_thread": False}
  engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

  def init_db():
      SQLModel.metadata.create_all(engine)

  def get_db():
      with Session(engine) as session:
          yield session
  ```

- [x] **Step 2: 创建 User 数据模型**
  写入 `backend/app/models/user.py`：
  ```python
  from datetime import datetime
  from typing import Optional
  from sqlmodel import SQLModel, Field

  class User(SQLModel, table=True):
      __tablename__: str = "users"
      
      id: str = Field(primary_key=True, index=True)   # 微信 OpenID 或 游客 UUID
      username: str                                   # 昵称
      avatar_url: Optional[str] = None                # 头像地址
      elo_rating: int = Field(default=1200)           # 天梯匹配分
      created_at: datetime = Field(default_factory=datetime.utcnow)
  ```

- [x] **Step 3: 创建 GameRecord 数据模型**
  写入 `backend/app/models/game_record.py`：
  ```python
  from datetime import datetime
  from sqlmodel import SQLModel, Field

  class GameRecord(SQLModel, table=True):
      __tablename__: str = "game_records"
      
      id: Optional[int] = Field(default=None, primary_key=True)
      user_id: str = Field(foreign_key="users.id", index=True)
      role_type: str                                  # 职业定位
      final_cash: float                               # 最终现金
      final_assets: float                             # 最终总资产
      profit_rate: float                              # 收益率
      transaction_log: str                            # 交易细节 JSON
      score_metrics: str                              # 雷达图评分与称号 JSON
      is_verified: bool = Field(default=False)         # 是否重放验证通过
      created_at: datetime = Field(default_factory=datetime.utcnow)
  ```

- [x] **Step 4: 在单元测试夹具中引入测试 SQLite 内存数据库**
  修改 `backend/tests/conftest.py`：
  ```python
  import pytest
  from sqlmodel import SQLModel, create_engine, Session
  from fastapi.testclient import TestClient
  from app.database.db import get_db
  from main import app

  @pytest.fixture(name="session")
  def session_fixture():
      engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
      SQLModel.metadata.create_all(engine)
      with Session(engine) as session:
          yield session

  @pytest.fixture(name="client")
  def client_fixture(session):
      def get_db_override():
          return session
      app.dependency_overrides[get_db] = get_db_override
      with TestClient(app) as client:
          yield client
      app.dependency_overrides.clear()
  ```

- [x] **Step 5: 编写 ORM 数据操作测试**
  写入 `backend/tests/test_db.py`：
  ```python
  from app.models.user import User
  from app.models.game_record import GameRecord

  def test_create_user_and_record(session):
      # 创建用户
      user = User(id="test_openid_123", username="股神测试员")
      session.add(user)
      session.commit()
      session.refresh(user)
      
      assert user.elo_rating == 1200
      
      # 创建游戏记录
      record = GameRecord(
          user_id=user.id,
          role_type="sales_manager",
          final_cash=20000.0,
          final_assets=50000.0,
          profit_rate=1.5,
          transaction_log="[]",
          score_metrics="{}",
          is_verified=True
      )
      session.add(record)
      session.commit()
      session.refresh(record)
      
      assert record.id is not None
      assert record.user_id == "test_openid_123"
  ```

- [x] **Step 6: 运行测试**
  在终端中运行：
  `pytest backend/tests/test_db.py -v`
  预期输出：`test_create_user_and_record PASSED`

---

### Task 3: 实现登录注册与用户 API

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/api/endpoints/auth.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_auth.py`

- [x] **Step 1: 创建认证 Pydantic 校验 Schema**
  写入 `backend/app/schemas/user.py`：
  ```python
  from typing import Optional
  from pydantic import BaseModel

  class AuthRequest(BaseModel):
      id: str                                         # 微信 OpenID 或游客临时 UUID
      username: str                                   # 用户昵称
      avatar_url: Optional[str] = None                # 头像 URL

  class UserResponse(BaseModel):
      id: str
      username: str
      avatar_url: Optional[str]
      elo_rating: int
  ```

- [x] **Step 2: 创建 auth 接口路由**
  写入 `backend/app/api/endpoints/auth.py`：
  ```python
  from fastapi import APIRouter, Depends, HTTPException
  from sqlmodel import Session
  from app.database.db import get_db
  from app.models.user import User
  from app.schemas.user import AuthRequest, UserResponse

  router = APIRouter()

  @router.post("/login", response_model=UserResponse)
  def login(auth_data: AuthRequest, db: Session = Depends(get_db)):
      # 查询用户是否存在，不存在则自动注册创建
      user = db.query(User).filter(User.id == auth_data.id).first()
      if not user:
          user = User(
              id=auth_data.id,
              username=auth_data.username,
              avatar_url=auth_data.avatar_url
          )
          db.add(user)
          db.commit()
          db.refresh(user)
      else:
          # 若存在，更新最新昵称和头像
          user.username = auth_data.username
          if auth_data.avatar_url:
              user.avatar_url = auth_data.avatar_url
          db.add(user)
          db.commit()
          db.refresh(user)
      return user
  ```

- [x] **Step 3: 将 auth 路由挂载至主 API 路由**
  修改 `backend/app/api/router.py`：
  ```python
  from fastapi import APIRouter
  from app.api.endpoints import auth

  api_router = APIRouter()
  api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

  @api_router.get("/health", tags=["health"])
  def health_check():
      return {"status": "ok", "message": "Stock Life Simulator API is healthy"}
  ```

- [x] **Step 4: 编写登录授权单元测试**
  创建并写入 `backend/tests/test_auth.py`：
  ```python
  def test_login_new_user(client):
      payload = {
          "id": "wx_openid_test_999",
          "username": "夜猫子股神",
          "avatar_url": "http://example.com/avatar.png"
      }
      # 第一次登录，注册新账户
      response = client.post("/api/v1/auth/login", json=payload)
      assert response.status_code == 200
      data = response.json()
      assert data["id"] == "wx_openid_test_999"
      assert data["username"] == "夜猫子股神"
      assert data["elo_rating"] == 1200

      # 第二次登录，数据更新/保持
      payload["username"] = "新改的股神名"
      response = client.post("/api/v1/auth/login", json=payload)
      assert response.status_code == 200
      assert response.json()["username"] == "新改的股神名"
  ```

- [x] **Step 5: 运行登录测试**
  在终端中运行：
  `pytest backend/tests/test_auth.py -v`
  预期输出：`test_login_new_user PASSED`

---

### Task 4: 实现战绩提交与记录查询 API

**Files:**
- Create: `backend/app/schemas/game_record.py`
- Create: `backend/app/api/endpoints/game.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_game.py`

- [x] **Step 1: 创建战绩 Schema**
  写入 `backend/app/schemas/game_record.py`：
  ```python
  from typing import List, Dict, Any
  from pydantic import BaseModel

  class RecordCreateRequest(BaseModel):
      user_id: str
      role_type: str
      final_cash: float
      final_assets: float
      profit_rate: float
      transaction_log: List[Dict[str, Any]]           # 客户端操盘指令日志
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

- [x] **Step 2: 实现战绩路由逻辑 (第一步：只存记录不校验，第二阶段再加入验证服务)**
  写入 `backend/app/api/endpoints/game.py`：
  ```python
  import json
  from typing import List
  from fastapi import APIRouter, Depends, HTTPException
  from sqlmodel import Session
  from app.database.db import get_db
  from app.models.user import User
  from app.models.game_record import GameRecord
  from app.schemas.game_record import RecordCreateRequest, RecordResponse

  router = APIRouter()

  @router.post("/record", response_model=RecordResponse)
  def save_game_record(payload: RecordCreateRequest, db: Session = Depends(get_db)):
      # 验证用户是否存在
      user = db.query(User).filter(User.id == payload.user_id).first()
      if not user:
          raise HTTPException(status_code=404, detail="User not found")
      
      # 序列化为 JSON 字符串存储
      tx_log_str = json.dumps(payload.transaction_log)
      metrics_str = json.dumps(payload.score_metrics)
      
      # 第一阶段：先默认验证通过，第二阶段对接重放校验服务
      record = GameRecord(
          user_id=payload.user_id,
          role_type=payload.role_type,
          final_cash=payload.final_cash,
          final_assets=payload.final_assets,
          profit_rate=payload.profit_rate,
          transaction_log=tx_log_str,
          score_metrics=metrics_str,
          is_verified=True                         # 默认校验为 True (临时占位)
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

- [x] **Step 3: 将 game 路由注入主 API 路由**
  修改 `backend/app/api/router.py`：
  ```python
  from fastapi import APIRouter
  from app.api.endpoints import auth, game

  api_router = APIRouter()
  api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
  api_router.include_router(game.router, prefix="/game", tags=["game"])

  @api_router.get("/health", tags=["health"])
  def health_check():
      return {"status": "ok", "message": "Stock Life Simulator API is healthy"}
  ```

- [x] **Step 4: 编写战绩保存与拉取历史记录测试**
  创建并写入 `backend/tests/test_game.py`：
  ```python
  def test_create_and_query_record(client):
      # 1. 注册一个测试用户
      user_payload = {"id": "user_shanghai_999", "username": "沪上第一股神"}
      client.post("/api/v1/auth/login", json=user_payload)

      # 2. 上报战绩
      record_payload = {
          "user_id": "user_shanghai_999",
          "role_type": "internet_worker",
          "final_cash": 12000.0,
          "final_assets": 60000.0,
          "profit_rate": 100.0,
          "transaction_log": [
              {"day": 1, "stock": "科技-01", "type": "BUY", "price": 10.0, "qty": 1000}
          ],
          "score_metrics": {"智慧": 80, "心态": 90, "社交": 70, "平衡": 85}
      }
      response = client.post("/api/v1/game/record", json=record_payload)
      assert response.status_code == 200
      data = response.json()
      assert data["final_assets"] == 60000.0
      assert data["is_verified"] is True
      assert data["id"] is not None

      # 3. 查询历史
      history_response = client.get("/api/v1/game/user/user_shanghai_999/history")
      assert history_response.status_code == 200
      history_data = history_response.json()
      assert len(history_data) == 1
      assert history_data[0]["role_type"] == "internet_worker"
  ```

- [x] **Step 5: 运行战绩测试**
  在终端中运行：
  `pytest backend/tests/test_game.py -v`
  预期输出：`test_create_and_query_record PASSED`
