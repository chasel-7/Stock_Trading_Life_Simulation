# Phase 10: 排行榜系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现4种全服排行榜（收益榜/智慧榜/社交达人榜/全能榜），支持本地存储和未来后端扩展。

**Architecture:** LeaderboardManager 管理排行数据，先使用 LocalStorage 存储（单机排行），预留 API 接口以便后续接入后端。LeaderboardScene 展示排行。

**Tech Stack:** TypeScript, Phaser 3

**前置依赖:** Phase 6 完成（评分系统）

---

### Task 1: 排行榜数据模型与管理器

**Files:**
- Create: `src/models/leaderboardTypes.ts`
- Create: `src/managers/LeaderboardManager.ts`
- Test: `src/managers/__tests__/LeaderboardManager.test.ts`

- [ ] **Step 1: 定义类型 src/models/leaderboardTypes.ts**

```typescript
export type LeaderboardCategory = 'total-return' | 'invest-wisdom' | 'social-roi' | 'overall';

export interface LeaderboardEntry {
  id: string;              // 唯一ID (timestamp-based)
  playerName: string;      // 角色名
  characterId: string;
  characterEmoji: string;
  totalReturn: number;     // 总收益率
  investWisdom: number;    // 投资智慧评分
  socialROI: number;       // 社交投资回报率
  overallScore: number;    // 四维总分
  title: string;           // 获得的称号
  timestamp: number;       // 提交时间
}

export interface LeaderboardConfig {
  category: LeaderboardCategory;
  name: string;
  emoji: string;
  sortField: keyof LeaderboardEntry;
}

export const LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  { category: 'total-return', name: '总收益榜', emoji: '💰', sortField: 'totalReturn' },
  { category: 'invest-wisdom', name: '智慧榜', emoji: '🧠', sortField: 'investWisdom' },
  { category: 'social-roi', name: '社交达人榜', emoji: '🤝', sortField: 'socialROI' },
  { category: 'overall', name: '全能榜', emoji: '🏅', sortField: 'overallScore' },
];
```

- [ ] **Step 2: 编写测试 src/managers/__tests__/LeaderboardManager.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LeaderboardManager } from '../LeaderboardManager';

describe('LeaderboardManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should submit and retrieve entries', () => {
    const mgr = new LeaderboardManager();
    mgr.submit({
      playerName: '测试玩家', characterId: 'programmer', characterEmoji: '🧑‍💻',
      totalReturn: 0.5, investWisdom: 80, socialROI: 60, overallScore: 70, title: '股海新秀',
    });
    const top = mgr.getTop('total-return', 10);
    expect(top.length).toBe(1);
    expect(top[0].totalReturn).toBe(0.5);
  });

  it('should sort by category field descending', () => {
    const mgr = new LeaderboardManager();
    mgr.submit({ playerName: 'A', characterId: 'programmer', characterEmoji: '🧑‍💻',
      totalReturn: 0.3, investWisdom: 90, socialROI: 50, overallScore: 60, title: 'A' });
    mgr.submit({ playerName: 'B', characterId: 'sales', characterEmoji: '👔',
      totalReturn: 0.8, investWisdom: 70, socialROI: 80, overallScore: 75, title: 'B' });
    const byReturn = mgr.getTop('total-return', 10);
    expect(byReturn[0].playerName).toBe('B');
    const byWisdom = mgr.getTop('invest-wisdom', 10);
    expect(byWisdom[0].playerName).toBe('A');
  });

  it('should limit to top N', () => {
    const mgr = new LeaderboardManager();
    for (let i = 0; i < 20; i++) {
      mgr.submit({ playerName: `P${i}`, characterId: 'programmer', characterEmoji: '🧑‍💻',
        totalReturn: i * 0.1, investWisdom: i, socialROI: i, overallScore: i, title: `T${i}` });
    }
    expect(mgr.getTop('total-return', 10).length).toBe(10);
  });
});
```

- [ ] **Step 3: 实现 src/managers/LeaderboardManager.ts**

```typescript
import { LeaderboardEntry, LeaderboardCategory, LEADERBOARD_CONFIGS } from '../models/leaderboardTypes';

const STORAGE_KEY = 'stock-life-leaderboard';

export class LeaderboardManager {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  submit(data: Omit<LeaderboardEntry, 'id' | 'timestamp'>): void {
    const entry: LeaderboardEntry = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    this.save();
  }

  getTop(category: LeaderboardCategory, limit: number): LeaderboardEntry[] {
    const config = LEADERBOARD_CONFIGS.find(c => c.category === category);
    if (!config) return [];
    const field = config.sortField;
    return [...this.entries]
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, limit);
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
  }

  private load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    this.entries = raw ? JSON.parse(raw) : [];
  }
}
```

- [ ] **Step 4: 运行测试**

```bash
npm run test -- LeaderboardManager
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add LeaderboardManager with 4 category rankings"
```

---

### Task 2: 排行榜展示场景

**Files:**
- Create: `src/scenes/LeaderboardScene.ts`
- Modify: `src/config/gameConfig.ts`（注册场景）
- Modify: `src/scenes/BootScene.ts`（添加入口按钮）
- Modify: `src/scenes/ReviewScene.ts`（游戏结束后自动提交）

- [ ] **Step 1: 创建 src/scenes/LeaderboardScene.ts**

```typescript
import Phaser from 'phaser';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { LEADERBOARD_CONFIGS, LeaderboardCategory } from '../models/leaderboardTypes';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class LeaderboardScene extends Phaser.Scene {
  private currentCategory: LeaderboardCategory = 'total-return';
  private listContainer!: Phaser.GameObjects.Container;
  private leaderboard!: LeaderboardManager;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    this.leaderboard = new LeaderboardManager();
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e, 1).setOrigin(0, 0);
    this.add.text(width / 2, 32, '🏆 排行榜', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // Tab栏（4个分类）
    const tabY = 72;
    LEADERBOARD_CONFIGS.forEach((config, i) => {
      const tabW = (width - 32) / 4;
      const tabX = 16 + i * tabW + tabW / 2;
      const tab = this.add.text(tabX, tabY, `${config.emoji}\n${config.name}`, {
        fontSize: '11px', color: '#aaa', fontFamily: 'sans-serif', align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      tab.on('pointerup', () => {
        this.currentCategory = config.category;
        this.renderList();
      });
    });

    // 列表容器
    this.listContainer = this.add.container(0, 120);
    this.renderList();

    // 返回按钮
    const backBg = this.add.rectangle(width / 2, height - 50, width - 40, 44, 0x333366, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 50, '← 返回', {
      fontSize: '16px', color: '#e0e0e0', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    backBg.on('pointerup', () => this.scene.start('BootScene'));
  }

  private renderList(): void {
    this.listContainer.removeAll(true);
    const { width } = this.scale;
    const entries = this.leaderboard.getTop(this.currentCategory, 20);
    const config = LEADERBOARD_CONFIGS.find(c => c.category === this.currentCategory)!;

    if (entries.length === 0) {
      this.listContainer.add(this.add.text(width / 2, 100, '暂无记录\n完成一局游戏后自动上榜', {
        fontSize: '14px', color: '#666', fontFamily: 'sans-serif', align: 'center',
      }).setOrigin(0.5));
      return;
    }

    entries.forEach((entry, i) => {
      const y = i * 48;
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const value = entry[config.sortField];
      const valueStr = config.category === 'total-return'
        ? `${((value as number) * 100).toFixed(1)}%`
        : `${value}分`;

      this.listContainer.add(this.add.text(24, y, `${rankEmoji}`, {
        fontSize: '16px', fontFamily: 'sans-serif',
      }));
      this.listContainer.add(this.add.text(56, y, `${entry.characterEmoji} ${entry.playerName}`, {
        fontSize: '14px', color: '#e0e0e0', fontFamily: 'sans-serif',
      }));
      this.listContainer.add(this.add.text(56, y + 20, entry.title, {
        fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
      }));
      this.listContainer.add(this.add.text(width - 24, y + 8, valueStr, {
        fontSize: '15px', color: '#4a90d9', fontFamily: 'monospace',
      }).setOrigin(1, 0));
    });
  }
}
```

- [ ] **Step 2: 注册场景并添加入口**

在 `gameConfig.ts` scene数组中添加 `LeaderboardScene`。

在 `BootScene.ts` 中添加「排行榜」按钮：

```typescript
const lbBg = this.add.rectangle(width / 2, height / 2 + 80, 200, 40, 0x333366, 1)
  .setInteractive({ useHandCursor: true });
this.add.text(width / 2, height / 2 + 80, '🏆 排行榜', {
  fontSize: '15px', color: '#e0e0e0', fontFamily: 'sans-serif',
}).setOrigin(0.5);
lbBg.on('pointerup', () => this.scene.start('LeaderboardScene'));
```

- [ ] **Step 3: ReviewScene 结束时自动提交排行**

在 ReviewScene 的 showRadarAndTitle() 中，生成评分后自动提交：

```typescript
const leaderboard = new LeaderboardManager();
leaderboard.submit({
  playerName: char.name,
  characterId: char.id,
  characterEmoji: char.emoji,
  totalReturn: (totalAssets - startingCash) / startingCash,
  investWisdom: scoreResult.investWisdom,
  socialROI: socialSceneCost > 0
    ? (infoValueGained / socialSceneCost) * 100
    : 0,
  overallScore: scoreResult.returnScore + scoreResult.riskControl
    + scoreResult.investWisdom + scoreResult.survivalSkill,
  title: titleResult.title,
});
```

- [ ] **Step 4: 验证编译**

```bash
npx tsc --noEmit
npm run dev
```

Expected: 主菜单有「排行榜」按钮→4个Tab可切换→游戏结束自动上榜。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add LeaderboardScene with 4 category rankings"
```
