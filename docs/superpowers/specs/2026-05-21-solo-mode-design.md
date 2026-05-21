# 股票交易人生模拟器 — 单人练习赛模式设计规格说明书

> **项目名称**：股票人生模拟器（Stock Life Simulation）
> **主题**：新增单人练习赛模式 (Practice Match)
> **日期**：2026-05-21
> **核心逻辑**：允许玩家以单人离线模式（不参与 WebSocket 排队匹配）开启一盘完整的 15 天模拟炒股，完赛后上传战绩但不对天梯 Elo 积分产生影响。

---

## 一、概述

当前系统中仅提供了一个 `🚀 寻找 PVP 竞技赛 (Elo 匹配)` 按钮。虽然对局底层是离线/沙盒化的，但玩家必须经过 WebSocket 配对逻辑。本设计旨在提供一个专门的单机练习赛入口，提升单人游玩的体验。

---

## 二、方案细节

### 2.1 数据库与模型改动

1. **`GameRecord` 数据库表 (game_records)**：
   新增字段 `is_practice: bool`，用以标记本局对局是否是单人练习赛。

2. **数据库兼容性迁移**：
   在 `init_db` 时，如果现有数据库没有该列，则自动利用 SQLite 的 `ALTER TABLE` DDL 添加此字段，确保玩家在更新后不会遭遇崩溃。

3. **Pydantic 校验 Schema**：
   - `RecordCreateRequest` 添加可选字段 `is_practice` (默认 `False`)。
   - `RecordResponse` 添加字段 `is_practice`。

### 2.2 后端接口逻辑 (`POST /record`)

接口 `/record` 在接收到完赛记录包时：
- 依然执行 `VerificationService.verify_game_log` 进行交易合理性防作弊重放校验。
- **Elo 分数计算变更**：
  - 若 `is_practice` 为 `False`：维持原 ELO 分数升降机制。
  - 若 `is_practice` 为 `True`：**不更改**用户的 `elo_rating`。
- 将对局记录持久化到 SQLite 数据库中，其中 `is_practice` 标志设为 `True`。

### 2.3 前端游戏状态与界面组件调整

1. **Zustand Store (`useGameStore`)**：
   - 增加全局状态 `isPvpMode`。
   - 调整 `startGame(seed, role, isPvp = false)` 方法以接收 `isPvp` 参数，并用其重置 `isPvpMode` 状态。

2. **主大厅页面 (Lobby)**：
   - 增加按钮 `🎮 开启单人练习赛 (不计天梯分)`。
   - 点击该按钮后：
     - 不触发 WebSocket 配对及 `startMatchmaking()` 流程。
     - 随机在本地生成形如 `practice_${random_str}` 的行情种子。
     - 调用 `store.startGame(seed, selectedRole, false)` 并将 `opponents` 设为 `{}`。
     - 阶段直接流转至 `TRADE`，跳过匹配搜寻状态。

3. **操盘界面**：
   - 仅在 `store.isPvpMode === true` 时显示 `<PVPMonitor />` 局内看板。
   - 对局头部标题根据 `isPvpMode` 切换显示：“单人模拟对局” 或 “竞技赛对局”。

4. **终局结算界面 (Settlement)**：
   - 当 `!store.isPvpMode` 时，结算页标题显示为 `🏆 练习赛终局对局结算`，天梯变动信息卡片中显示为“本局为练习赛，不计天梯积分”。
   - 在向 `/record` 上报战绩时，封装参数 `is_practice: !store.isPvpMode`。

5. **大厅战绩展示**：
   - 在历史列表中，给每一项增加 `[练习]` 或 `[竞技]` 的醒目标签。

---

## 三、验证计划

1. **后端验证**：
   - 修改 `tests/test_game.py` 或添加单元测试，验证 `/record` 接口在收到 `is_practice=True` 的请求时：
     - 能够成功保存记录且 `is_practice` 为 True。
     - 用户原有的 `elo_rating` 保持不变。
2. **前端验证**：
   - 点击“单人练习赛”按钮直接开始游戏，不产生 WebSocket 连接。
   - 操盘期间无 PVP 看板，界面正常显示“单人模拟对局”。
   - 完赛后成功上传，并且大厅战绩列表中追加了带有 `[练习]` 标示的对应记录。
