# 股票人生模拟器 — 8阶段开发计划总览

> 将完整游戏设计规格说明书拆分为8个递增阶段，每阶段产出可测试、可运行的软件。
> 设计规格：[stock-life-simulator-design.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/specs/2026-04-22-stock-life-simulator-design.md)

---

## Phase 1：项目脚手架 + 数据层（Task 1-10）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase1-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase1-part1.md) | Vite+TS+Phaser搭建、目录结构、类型定义、角色配置 | Task 1-4 |
| [phase1-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase1-part2.md) | 股票池JSON、行情生成脚本、StockManager、GameStateManager | Task 5-7 |
| [phase1-part3.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase1-part3.md) | 4个Phaser场景骨架串联、GameManager注册、SaveManager | Task 8-10 |

---

## Phase 2：盘中交易核心（Task 1-10）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase2-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase2-part1.md) | StockRow行组件、自选股列表面板、持仓面板、Tab栏 | Task 1-4 |
| [phase2-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase2-part2.md) | 分时走势图、K线蜡烛图、个股详情页 | Task 5-7 |
| [phase2-part3.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase2-part3.md) | 下单弹窗（仓位选择）、价格步进引擎、TradingScene集成 | Task 8-10 |

---

## Phase 3：日循环 + 经济模型（Task 1-6）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase3-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase3-part1.md) | 心情计算器、大盘趋势生成、PreMarketScene完整UI | Task 1-3 |
| [phase3-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase3-part2.md) | SettlementManager日结算、破产/胜利/到期判定、存档恢复 | Task 4-6 |

---

## Phase 4：盘后场景系统（Task 1-5）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase4-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase4-part1.md) | 场景数据配置、心情解锁机制、事件卡片组件 | Task 1-3 |
| [phase4-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase4-part2.md) | InfoManager信息管理、PostMarketScene完整流程 | Task 4-5 |

---

## Phase 5：角色 + 事件系统（Task 1-8）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase5-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase5-part1.md) | 生活突发事件引擎、事件弹窗UI、结算集成、角色能力 | Task 1-4 |
| [phase5-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase5-part2.md) | InfoManager集成、场景信息收集、情报面板、串联检测 | Task 5-8 |

---

## Phase 6：终局复盘（Task 1-6）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase6-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase6-part1.md) | TradeLogger交易记录、认知偏差检测（5种）、评分+称号系统 | Task 1-3 |
| [phase6-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase6-part2.md) | 资产曲线图、雷达图、ReviewScene 4步复盘流程 | Task 4-6 |

---

## Phase 7：UI打磨 + 动画（Task 1-9）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase7-part1.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase7-part1.md) | 设计系统(theme)、圆角卡片工厂、场景转场、字体、价格动画 | Task 1-5 |
| [phase7-part2.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase7-part2.md) | BootScene升级、全场景主题适配、程序化音效、微交互动画 | Task 6-9 |

---

## Phase 8：集成测试 + 发布准备（Task 1-8）

| 子计划 | 内容 | 任务 |
|--------|------|------|
| [phase8.md](file:///Users/xiangfang/Developer/projects/Stock_Trading_Life_Simulation/docs/superpowers/plans/2026-05-13-phase8.md) | E2E冒烟测试、移动端适配、性能优化、PWA、部署、README | Task 1-8 |

---

## 统计

| 指标 | 数值 |
|------|------|
| 总阶段数 | 8 |
| 总子计划文件 | 17 |
| 总Task数 | ~72 |
| 总Step数 | ~250+ |
| 预估代码文件 | ~35 |
| 预估测试文件 | ~12 |
