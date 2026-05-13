# Phase 9: 新手引导系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现叙事式教学系统，Day1-2为教学关卡，NPC引导认识交易界面、买卖操作、场景选择。

**Architecture:** TutorialManager 管理教学状态，通过Phaser对话框叠加层在各Scene上渲染引导气泡。首次游玩检测 + 可跳过。

**Tech Stack:** TypeScript, Phaser 3

**前置依赖:** Phase 1-8 全部完成

---

### Task 1: 教学数据与管理器

**Files:**
- Create: `src/data/tutorialSteps.ts`
- Create: `src/managers/TutorialManager.ts`
- Test: `src/managers/__tests__/TutorialManager.test.ts`

- [ ] **Step 1: 定义教学步骤数据 src/data/tutorialSteps.ts**

```typescript
export interface TutorialStep {
  id: string;
  day: number;           // 在哪天触发
  phase: 'pre-market' | 'trading' | 'post-market' | 'settlement';
  npcName: string;
  npcEmoji: string;
  message: string;
  /** 高亮区域（可选） */
  highlightArea?: { x: number; y: number; w: number; h: number };
  /** 需要用户完成的操作才能继续 */
  waitForAction?: 'buy' | 'sell' | 'choose-scene' | 'next-phase' | 'none';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // === Day 1: 认识交易界面 ===
  {
    id: 'welcome',
    day: 1, phase: 'pre-market',
    npcName: '老张', npcEmoji: '👴',
    message: '欢迎来到股市！我是你的同事老张，今天教你看盘。先看看今天的大盘趋势和推荐股吧。',
    waitForAction: 'next-phase',
  },
  {
    id: 'trading-intro',
    day: 1, phase: 'trading',
    npcName: '老张', npcEmoji: '👴',
    message: '这是盘中交易界面。上面是自选股列表，点击可以看K线图。试试买入一支股票吧！',
    highlightArea: { x: 0, y: 60, w: 390, h: 300 },
    waitForAction: 'buy',
  },
  {
    id: 'after-buy',
    day: 1, phase: 'trading',
    npcName: '老张', npcEmoji: '👴',
    message: '不错！你可以选择全仓、半仓或1/4仓。仓位管理很重要，别把鸡蛋放一个篮子里。',
    waitForAction: 'next-phase',
  },
  {
    id: 'settlement-intro',
    day: 1, phase: 'settlement',
    npcName: '老张', npcEmoji: '👴',
    message: '每天结束后会扣除生活费和手续费，然后显示今天的盈亏。明天我再教你别的。',
    waitForAction: 'none',
  },
  // === Day 2: 场景选择与信息系统 ===
  {
    id: 'day2-premarket',
    day: 2, phase: 'pre-market',
    npcName: '老张', npcEmoji: '👴',
    message: '第二天了！注意看你的心情状态，它会影响你能去哪些盘后场景。',
    waitForAction: 'next-phase',
  },
  {
    id: 'post-market-intro',
    day: 2, phase: 'post-market',
    npcName: '老张', npcEmoji: '👴',
    message: '收盘后可以选择去不同场景社交。花钱的场景能获取更多信息。试试去大排档吧！',
    highlightArea: { x: 0, y: 200, w: 390, h: 400 },
    waitForAction: 'choose-scene',
  },
  {
    id: 'info-intro',
    day: 2, phase: 'post-market',
    npcName: '老张', npcEmoji: '👴',
    message: '你获得了一条信息！如果从不同来源获得关于同一支股票的信息，准确率会大幅提升。从第3天开始，你就要靠自己了。加油！',
    waitForAction: 'none',
  },
];
```

- [ ] **Step 2: 编写测试 src/managers/__tests__/TutorialManager.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { TutorialManager } from '../TutorialManager';

describe('TutorialManager', () => {
  it('should return steps for day 1 pre-market', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(1, 'pre-market');
    expect(steps.length).toBe(1);
    expect(steps[0].id).toBe('welcome');
  });

  it('should return no steps for day 3+', () => {
    const mgr = new TutorialManager();
    const steps = mgr.getStepsForPhase(3, 'pre-market');
    expect(steps.length).toBe(0);
  });

  it('should track completed steps', () => {
    const mgr = new TutorialManager();
    expect(mgr.isCompleted('welcome')).toBe(false);
    mgr.complete('welcome');
    expect(mgr.isCompleted('welcome')).toBe(true);
  });

  it('should detect first-time player', () => {
    const mgr = new TutorialManager();
    expect(mgr.isFirstTime()).toBe(true);
    mgr.markTutorialDone();
    expect(mgr.isFirstTime()).toBe(false);
  });

  it('should allow skipping', () => {
    const mgr = new TutorialManager();
    mgr.skipAll();
    expect(mgr.getStepsForPhase(1, 'pre-market').length).toBe(0);
  });
});
```

- [ ] **Step 3: 实现 src/managers/TutorialManager.ts**

```typescript
import { TUTORIAL_STEPS, TutorialStep } from '../data/tutorialSteps';

const STORAGE_KEY = 'stock-life-tutorial-done';

export class TutorialManager {
  private completedSteps = new Set<string>();
  private skipped = false;

  constructor() {
    this.skipped = localStorage.getItem(STORAGE_KEY) === 'true';
  }

  isFirstTime(): boolean {
    return !this.skipped;
  }

  getStepsForPhase(day: number, phase: string): TutorialStep[] {
    if (this.skipped) return [];
    return TUTORIAL_STEPS.filter(
      s => s.day === day && s.phase === phase && !this.completedSteps.has(s.id)
    );
  }

  complete(stepId: string): void {
    this.completedSteps.add(stepId);
  }

  isCompleted(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }

  skipAll(): void {
    this.skipped = true;
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  markTutorialDone(): void {
    this.skipped = true;
    localStorage.setItem(STORAGE_KEY, 'true');
  }
}
```

- [ ] **Step 4: 运行测试**

```bash
npm run test -- TutorialManager
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add TutorialManager and tutorial step definitions"
```

---

### Task 2: 对话气泡UI组件

**Files:**
- Create: `src/ui/DialogBubble.ts`

- [ ] **Step 1: 创建 src/ui/DialogBubble.ts**

```typescript
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';

export interface DialogBubbleConfig {
  npcName: string;
  npcEmoji: string;
  message: string;
  onDismiss: () => void;
  highlightArea?: { x: number; y: number; w: number; h: number };
}

export class DialogBubble {
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: DialogBubbleConfig) {
    const { width, height } = scene.scale;

    // 半透明遮罩
    this.overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.5)
      .setOrigin(0, 0).setDepth(998).setInteractive();

    // 高亮区域（如果有）
    if (config.highlightArea) {
      const { x, y, w, h } = config.highlightArea;
      const highlight = scene.add.rectangle(x, y, w, h)
        .setOrigin(0, 0).setDepth(999)
        .setStrokeStyle(2, 0xffd700, 1);
      this.overlay.on('destroy', () => highlight.destroy());
    }

    // 对话框
    this.container = scene.add.container(0, height - 200).setDepth(1000);

    const bubbleBg = scene.add.graphics();
    bubbleBg.fillStyle(0x1e1e3a, 0.95);
    bubbleBg.fillRoundedRect(16, 0, width - 32, 160, 12);
    bubbleBg.lineStyle(1, 0x4a90d9, 0.8);
    bubbleBg.strokeRoundedRect(16, 0, width - 32, 160, 12);
    this.container.add(bubbleBg);

    // NPC头像+名字
    this.container.add(scene.add.text(32, 12, `${config.npcEmoji} ${config.npcName}`, {
      fontSize: '15px', color: '#ffd700', fontFamily: 'sans-serif',
    }));

    // 消息文本
    this.container.add(scene.add.text(32, 40, config.message, {
      fontSize: '13px', color: '#e0e0e0', fontFamily: 'sans-serif',
      wordWrap: { width: width - 80 }, lineSpacing: 6,
    }));

    // 点击继续
    this.container.add(scene.add.text(width - 48, 132, '点击继续 →', {
      fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(1, 0));

    // 跳过按钮
    const skipBtn = scene.add.text(48, 132, '跳过教学', {
      fontSize: '11px', color: '#666', fontFamily: 'sans-serif',
    }).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerup', () => {
      this.destroy();
      config.onDismiss();
    });
    this.container.add(skipBtn);

    this.overlay.on('pointerup', () => {
      this.destroy();
      config.onDismiss();
    });
  }

  destroy(): void {
    this.overlay.destroy();
    this.container.destroy();
  }
}
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add DialogBubble UI component for tutorial overlay"
```

---

### Task 3: 集成教学到各场景

**Files:**
- Modify: `src/scenes/PreMarketScene.ts`
- Modify: `src/scenes/TradingScene.ts`
- Modify: `src/scenes/PostMarketScene.ts`
- Modify: `src/scenes/SettlementScene.ts`
- Modify: `src/scenes/BootScene.ts`（首次游玩检测）

- [ ] **Step 1: 在BootScene添加首次游玩检测**

在 `src/scenes/BootScene.ts` 中，新游戏时将TutorialManager注入registry：

```typescript
import { TutorialManager } from '../managers/TutorialManager';

// 在create()中：
const tutorial = new TutorialManager();
this.registry.set('tutorialManager', tutorial);
```

- [ ] **Step 2: 在各Scene的create()中注入教学气泡**

每个场景的create()方法末尾，添加教学检测逻辑。以PreMarketScene为例：

```typescript
import { DialogBubble } from '../ui/DialogBubble';

// 在create()末尾：
const tutorial = this.registry.get('tutorialManager') as TutorialManager;
if (tutorial) {
  const steps = tutorial.getStepsForPhase(state.currentDay, 'pre-market');
  if (steps.length > 0) {
    let idx = 0;
    const showNext = () => {
      if (idx >= steps.length) return;
      const step = steps[idx];
      new DialogBubble(this, {
        npcName: step.npcName,
        npcEmoji: step.npcEmoji,
        message: step.message,
        highlightArea: step.highlightArea,
        onDismiss: () => {
          tutorial.complete(step.id);
          idx++;
          showNext();
        },
      });
    };
    showNext();
  }
}
```

对TradingScene、PostMarketScene、SettlementScene做相同操作，仅改变phase参数。

- [ ] **Step 3: Day 2结束后标记教学完成**

在SettlementScene中，Day 2结算后调用：

```typescript
if (state.currentDay === 2) {
  const tutorial = this.registry.get('tutorialManager') as TutorialManager;
  if (tutorial) tutorial.markTutorialDone();
}
```

- [ ] **Step 4: 验证编译并测试完整教学流程**

```bash
npx tsc --noEmit
npm run dev
```

Expected: 首次游玩 → Day1显示老张的教学气泡 → 可点击继续或跳过 → Day2继续教学 → Day3起无气泡。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate tutorial system into all game scenes"
```
