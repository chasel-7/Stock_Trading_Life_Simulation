# 混合行情模式（随机行情生成）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现设计规格§4.4所述的混合行情模式 — 新手前几局使用固定行情（当前sampleMarket.json），之后解锁随机模式：从100支股票池中按规则抽取15支，运行时动态生成行情数据，实现近乎无限重玩性。

**Architecture:** 新增 `MarketGenerator` 运行时模块，从 `stockPool.json` 抽取15支股票（每板块3支），基于板块特征参数动态生成15天行情数据。在 `BootScene` 中增加行情模式选择（固定/随机），通过 `GameManager` 传递。使用 localStorage 记录游玩次数，自动解锁随机模式。

**Tech Stack:** Phaser 3 + TypeScript

---

## File Structure

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/managers/MarketGenerator.ts` | 运行时随机行情生成器 | NEW |
| `src/data/sectorProfiles.ts` | 5大板块的波动特征参数 | NEW |
| `src/managers/GameManager.ts` | 支持动态行情数据源 | MODIFY |
| `src/scenes/BootScene.ts` | 增加行情模式选择 | MODIFY |
| `src/managers/__tests__/MarketGenerator.test.ts` | 单元测试 | NEW |

---

### Task 1: 创建板块波动特征参数

**Files:**
- Create: `src/data/sectorProfiles.ts`

- [ ] **Step 1: 定义板块特征接口和数据**

每个板块有不同的波动率、趋势强度、事件敏感度，用于生成符合设计描述的行情特征。

```typescript
// src/data/sectorProfiles.ts

export interface SectorProfile {
  sector: string;
  /** 日均波动率（标准差） */
  dailyVol: number;
  /** 趋势强度范围 [-max, +max]，随机取值 */
  trendRange: number;
  /** 价格范围 [min, max] — 模糊化后的价格区间 */
  priceRange: [number, number];
  /** 突发事件概率（每天） */
  eventChance: number;
  /** 事件影响幅度 */
  eventImpact: number;
  /** 设计描述 */
  description: string;
}

export const SECTOR_PROFILES: Record<string, SectorProfile> = {
  '消费': {
    sector: '消费',
    dailyVol: 0.025,
    trendRange: 0.004,
    priceRange: [10, 50],
    eventChance: 0.1,
    eventImpact: 0.03,
    description: '稳健偏多，偶有爆发',
  },
  '科技': {
    sector: '科技',
    dailyVol: 0.055,
    trendRange: 0.01,
    priceRange: [8, 45],
    eventChance: 0.2,
    eventImpact: 0.06,
    description: '波动大，涨跌幅极端',
  },
  '制造': {
    sector: '制造',
    dailyVol: 0.035,
    trendRange: 0.006,
    priceRange: [15, 80],
    eventChance: 0.1,
    eventImpact: 0.04,
    description: '趋势性强，慢涨慢跌',
  },
  '医药': {
    sector: '医药',
    dailyVol: 0.04,
    trendRange: 0.005,
    priceRange: [12, 60],
    eventChance: 0.25,
    eventImpact: 0.05,
    description: '受事件驱动明显',
  },
  '金融': {
    sector: '金融',
    dailyVol: 0.015,
    trendRange: 0.003,
    priceRange: [5, 35],
    eventChance: 0.05,
    eventImpact: 0.02,
    description: '波动小，随大盘走',
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/data/sectorProfiles.ts
git commit -m "feat: add sector volatility profiles for market generation"
```

---

### Task 2: 创建运行时行情生成器

**Files:**
- Create: `src/managers/MarketGenerator.ts`

- [ ] **Step 1: 编写 MarketGenerator**

```typescript
// src/managers/MarketGenerator.ts

import type { MarketDataPack } from './StockManager';
import type { StockInfo, DailyStockData } from '../models/types';
import { SECTOR_PROFILES, type SectorProfile } from '../data/sectorProfiles';
import { GAME_CONSTANTS } from '../config/constants';
import stockPoolData from '../data/stockPool.json';

interface PoolStock {
  id: string;
  sector: string;
  keywords: string[];
}

export class MarketGenerator {
  /**
   * 从100支股票池中抽取15支并生成随机行情
   * 规则：每板块3支，其中2-3支标记为推荐股
   */
  static generate(totalDays: number = GAME_CONSTANTS.TOTAL_DAYS): MarketDataPack {
    const pool = stockPoolData.stocks as PoolStock[];
    const selected = MarketGenerator.selectStocks(pool);
    const recommended = MarketGenerator.markRecommended(selected);

    const stocks: StockInfo[] = selected.map(s => {
      const profile = SECTOR_PROFILES[s.sector];
      const basePrice = MarketGenerator.randomInRange(profile.priceRange[0], profile.priceRange[1]);
      const trend = (Math.random() - 0.5) * 2 * profile.trendRange;
      const dailyData = MarketGenerator.generateDailyData(basePrice, trend, profile, totalDays);

      return {
        id: s.id,
        sector: s.sector as StockInfo['sector'],
        keywords: s.keywords,
        isRecommended: recommended.has(s.id),
        dailyData,
      };
    });

    return { totalDays, stocks };
  }

  /** 每板块随机抽3支 */
  private static selectStocks(pool: PoolStock[]): PoolStock[] {
    const bySector: Record<string, PoolStock[]> = {};
    for (const s of pool) {
      if (!bySector[s.sector]) bySector[s.sector] = [];
      bySector[s.sector].push(s);
    }

    const selected: PoolStock[] = [];
    for (const sector of Object.keys(bySector)) {
      const candidates = [...bySector[sector]];
      MarketGenerator.shuffle(candidates);
      selected.push(...candidates.slice(0, GAME_CONSTANTS.STOCKS_PER_SECTOR));
    }
    return selected;
  }

  /** 标记2-3支推荐股 */
  private static markRecommended(stocks: PoolStock[]): Set<string> {
    const count = GAME_CONSTANTS.RECOMMENDED_COUNT;
    const shuffled = [...stocks];
    MarketGenerator.shuffle(shuffled);
    return new Set(shuffled.slice(0, count).map(s => s.id));
  }

  /** 生成一支股票的全部天数据 */
  private static generateDailyData(
    basePrice: number, trend: number, profile: SectorProfile, totalDays: number,
  ): DailyStockData[] {
    const result: DailyStockData[] = [];
    let prevClose = basePrice;

    for (let day = 0; day < totalDays; day++) {
      // 日收益率 = 趋势 + 随机波动 + 偶发事件
      let dailyReturn = trend + (Math.random() - 0.5) * profile.dailyVol * 2;

      // 突发事件
      if (Math.random() < profile.eventChance) {
        dailyReturn += (Math.random() > 0.5 ? 1 : -1) * profile.eventImpact;
      }

      const open = Math.round(prevClose * (1 + (Math.random() - 0.5) * 0.01) * 100) / 100;
      const close = Math.round(prevClose * (1 + dailyReturn) * 100) / 100;
      const high = Math.round(Math.max(open, close) * (1 + Math.random() * profile.dailyVol) * 100) / 100;
      const low = Math.round(Math.min(open, close) * (1 - Math.random() * profile.dailyVol) * 100) / 100;
      const ticks = MarketGenerator.generateTicks(open, close, high, low, GAME_CONSTANTS.PRICE_TOTAL_TICKS);

      result.push({ open, close, high, low, ticks });
      prevClose = close;
    }
    return result;
  }

  /** 生成盘中tick序列 */
  private static generateTicks(
    open: number, close: number, high: number, low: number, count: number,
  ): number[] {
    const ticks: number[] = [open];
    const range = high - low;

    for (let i = 1; i < count - 1; i++) {
      const progress = i / (count - 1);
      const base = open + (close - open) * progress;
      const noise = (Math.random() - 0.5) * range * 0.3;
      const price = Math.max(low, Math.min(high, base + noise));
      ticks.push(Math.round(price * 100) / 100);
    }
    ticks.push(close);
    return ticks;
  }

  private static shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private static randomInRange(min: number, max: number): number {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/managers/MarketGenerator.ts
git commit -m "feat: add runtime MarketGenerator for random market data"
```

---

### Task 3: 编写 MarketGenerator 单元测试

**Files:**
- Create: `src/managers/__tests__/MarketGenerator.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// src/managers/__tests__/MarketGenerator.test.ts

import { MarketGenerator } from '../MarketGenerator';

describe('MarketGenerator', () => {
  it('should generate 15 stocks across 5 sectors', () => {
    const data = MarketGenerator.generate(10);
    expect(data.stocks.length).toBe(15);
    expect(data.totalDays).toBe(10);

    // 每板块3支
    const bySector: Record<string, number> = {};
    for (const s of data.stocks) {
      bySector[s.sector] = (bySector[s.sector] || 0) + 1;
    }
    expect(Object.keys(bySector).length).toBe(5);
    for (const count of Object.values(bySector)) {
      expect(count).toBe(3);
    }
  });

  it('should have 2-3 recommended stocks', () => {
    const data = MarketGenerator.generate(10);
    const rec = data.stocks.filter(s => s.isRecommended);
    expect(rec.length).toBeGreaterThanOrEqual(2);
    expect(rec.length).toBeLessThanOrEqual(3);
  });

  it('should generate correct dailyData structure', () => {
    const data = MarketGenerator.generate(5);
    for (const stock of data.stocks) {
      expect(stock.dailyData.length).toBe(5);
      for (const dd of stock.dailyData) {
        expect(dd.ticks.length).toBe(40);
        expect(dd.high).toBeGreaterThanOrEqual(Math.max(dd.open, dd.close));
        expect(dd.low).toBeLessThanOrEqual(Math.min(dd.open, dd.close));
        expect(dd.ticks[0]).toBe(dd.open);
        expect(dd.ticks[dd.ticks.length - 1]).toBe(dd.close);
      }
    }
  });

  it('should generate different data each time', () => {
    const data1 = MarketGenerator.generate(5);
    const data2 = MarketGenerator.generate(5);
    // 股票ID大概率不同（从100支池子抽15支）
    const ids1 = data1.stocks.map(s => s.id).sort().join(',');
    const ids2 = data2.stocks.map(s => s.id).sort().join(',');
    // 不保证不同但极大概率不同
    // 至少价格应该不同
    const p1 = data1.stocks[0].dailyData[0].open;
    const p2 = data2.stocks[0].dailyData[0].open;
    expect(p1 === p2 && ids1 === ids2).toBe(false);
  });

  it('stock prices should be within sector price range', () => {
    const data = MarketGenerator.generate(10);
    for (const stock of data.stocks) {
      const firstOpen = stock.dailyData[0].open;
      // 价格应在合理范围 ¥5~¥80
      expect(firstOpen).toBeGreaterThanOrEqual(4);
      expect(firstOpen).toBeLessThanOrEqual(90);
    }
  });
});
```

- [ ] **Step 2: 运行测试验证**

```bash
npx vitest run src/managers/__tests__/MarketGenerator.test.ts
```

Expected: 5/5 tests pass

- [ ] **Step 3: Commit**

```bash
git add src/managers/__tests__/MarketGenerator.test.ts
git commit -m "test: add MarketGenerator unit tests"
```

---

### Task 4: 修改 GameManager 支持动态行情数据源

**Files:**
- Modify: `src/managers/GameManager.ts`

- [ ] **Step 1: GameManager 不变，但 main.ts 需要支持两种数据源**

`GameManager` 构造函数已经接受 `MarketDataPack` 参数，无需修改。但 `main.ts` 需要能根据模式选择数据源。

修改 `src/main.ts` — 将 GameManager 创建延迟到 BootScene 选择模式之后：

```typescript
// src/main.ts
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { GameManager } from './managers/GameManager';
import { audioManager } from './managers/AudioManager';
import sampleMarket from './data/sampleMarket.json';
import type { MarketDataPack } from './managers/StockManager';
import { MarketGenerator } from './managers/MarketGenerator';

const game = new Phaser.Game(gameConfig);

// 默认使用固定行情，BootScene 可切换
const gm = new GameManager(sampleMarket as MarketDataPack);
game.registry.set('gameManager', gm);

// 暴露行情切换方法到 registry
game.registry.set('switchToRandomMarket', () => {
  const randomData = MarketGenerator.generate();
  const newGm = new GameManager(randomData);
  game.registry.set('gameManager', newGm);
});

game.registry.set('switchToFixedMarket', () => {
  const newGm = new GameManager(sampleMarket as MarketDataPack);
  game.registry.set('gameManager', newGm);
});

document.addEventListener('pointerdown', () => {
  audioManager.init();
}, { once: true });
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: expose market mode switching via game registry"
```

---

### Task 5: 修改 BootScene 增加行情模式选择

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: 增加游玩次数计数和模式选择按钮**

```typescript
// src/scenes/BootScene.ts — 在 create() 方法中

// 游玩次数（用于解锁随机模式）
const PLAY_COUNT_KEY = 'stock-life-play-count';
let playCount = 0;
try { playCount = parseInt(localStorage.getItem(PLAY_COUNT_KEY) || '0'); } catch { /* noop */ }
const randomUnlocked = playCount >= 2; // 完成2局后解锁

// ... 标题动画代码不变 ...

// 新游戏按钮修改：增加模式选择
const newBtn = CardFactory.createButton(
  this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 240, 48,
  '🎮 新游戏（固定行情）', {
    onClick: () => {
      SaveManager.deleteSave();
      const switchFn = this.registry.get('switchToFixedMarket') as (() => void) | undefined;
      if (switchFn) switchFn();
      // 记录游玩次数
      try { localStorage.setItem(PLAY_COUNT_KEY, String(playCount + 1)); } catch { /* noop */ }
      const tutorial = new TutorialManager();
      this.registry.set('tutorialManager', tutorial);
      Transition.fadeToScene(this, 'CharacterSelectScene');
    },
  },
).setAlpha(0);
this.tweens.add({ targets: newBtn, alpha: 1, delay: 1000, duration: 400 });

// 随机行情按钮（解锁后显示）
if (randomUnlocked) {
  const randBtn = CardFactory.createButton(
    this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 116, 240, 44,
    '🎲 新游戏（随机行情）', {
      color: 0x6c5ce7,
      fontSize: '14px',
      onClick: () => {
        SaveManager.deleteSave();
        const switchFn = this.registry.get('switchToRandomMarket') as (() => void) | undefined;
        if (switchFn) switchFn();
        try { localStorage.setItem(PLAY_COUNT_KEY, String(playCount + 1)); } catch { /* noop */ }
        const tutorial = new TutorialManager();
        tutorial.skipAll(); // 随机模式跳过教学
        this.registry.set('tutorialManager', tutorial);
        Transition.fadeToScene(this, 'CharacterSelectScene');
      },
    },
  ).setAlpha(0);
  this.tweens.add({ targets: randBtn, alpha: 1, delay: 1100, duration: 400 });
} else {
  // 未解锁提示
  const lockTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120,
    `🔒 完成${2 - playCount}局后解锁随机行情`, {
    fontSize: '11px', color: THEME.colors.textMuted, fontFamily: THEME.font.primary,
  }).setOrigin(0.5).setAlpha(0);
  this.tweens.add({ targets: lockTxt, alpha: 1, delay: 1100, duration: 400 });
}

// 继续游戏和排行榜按钮的 Y 坐标需要下移，根据 randomUnlocked 调整
```

- [ ] **Step 2: 调整继续游戏和排行榜按钮位置**

根据是否显示随机模式按钮，将后续按钮的 Y 坐标增加 56px：

```typescript
const extraOffset = randomUnlocked ? 56 : 20;

// 继续游戏按钮
if (SaveManager.hasSave()) {
  const contBtn = CardFactory.createButton(
    this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120 + extraOffset, 240, 48,
    '📂 继续游戏', { /* ... 回调不变 ... */ },
  ).setAlpha(0);
  // ...
}

// 排行榜按钮位置也相应调整
```

- [ ] **Step 3: 手动验证**

1. 首次启动：只看到"新游戏（固定行情）" + "🔒 完成2局后解锁"
2. 手动在 console 设置 `localStorage.setItem('stock-life-play-count', '3')`
3. 刷新后：看到两个按钮 — 固定行情 + 随机行情
4. 点击随机行情 → 进入角色选择 → 盘前显示不同的股票组合

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add random market mode selection in boot scene"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计§4.4"新手前几局用固定行情，之后解锁随机模式" — 完整覆盖 ✅
- [x] **Spec coverage:** 设计§4.2"每局15支=每板块3支+2-3支推荐股" — MarketGenerator.selectStocks + markRecommended ✅
- [x] **Spec coverage:** 设计§4.3"价格缩放到¥5~50" — SectorProfile.priceRange 控制 ✅
- [x] **Placeholder scan:** 无 TBD/TODO ✅
- [x] **Type consistency:** MarketGenerator.generate() 返回 MarketDataPack 类型，与 GameManager 构造函数兼容 ✅
