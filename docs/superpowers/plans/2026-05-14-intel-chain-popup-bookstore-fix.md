# 情报串联展示面板 + 书店减半天数修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现设计规格§5.1第三层"情报串联"的完整UI展示 — 当同一支股票累计获得2条以上不同来源信息时，弹出专门的情报串联面板，给出高确信度综合研判。同时修正书店手续费减半持续天数（代码3天 → 设计5天）。

**Architecture:** 新增 `IntelChainPopup` UI组件，在 PostMarketScene 中情报串联触发时弹出。升级 `InfoManager` 生成综合研判文本。书店天数修正仅需改动 scenes.ts 中的 specialEffect 文本和 PostMarketScene 中的解析逻辑。

**Tech Stack:** Phaser 3 + TypeScript

---

## File Structure

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/ui/IntelChainPopup.ts` | 情报串联弹窗组件 | NEW |
| `src/managers/InfoManager.ts` | 升级：生成综合研判 | MODIFY |
| `src/scenes/PostMarketScene.ts` | 触发情报串联弹窗 | MODIFY |
| `src/ui/InfoPanel.ts` | 已串联股票的视觉标记增强 | MODIFY |
| `src/data/scenes.ts` | 书店事件天数修正 | MODIFY |

---

### Task 1: 升级 InfoManager — 增加综合研判生成

**Files:**
- Modify: `src/managers/InfoManager.ts`

- [ ] **Step 1: 添加综合研判生成方法**

在 `InfoManager` 中新增 `generateChainVerdict()` 方法，当同一支股票有2+不同来源时，综合各条信息的准确度生成高确信度研判：

```typescript
// src/managers/InfoManager.ts — 在类中添加

export interface ChainVerdict {
  stockId: string;
  sources: string[];
  combinedAccuracy: number;
  verdict: string;
  details: string[];
}

// 在 InfoManager 类中添加方法：

/** 生成情报串联综合研判 */
generateChainVerdict(stockId: string): ChainVerdict | null {
  const infos = this.infoList.filter(i => i.stockId === stockId);
  const sources = new Set(infos.map(i => i.source));
  if (sources.size < 2) return null;

  // 综合准确度：多源交叉验证提升到 ~90%
  const avgAccuracy = infos.reduce((a, b) => a + b.accuracy, 0) / infos.length;
  const combinedAccuracy = Math.min(0.9, avgAccuracy + sources.size * 0.15);

  // 汇总各条信息内容
  const details = infos.map(i => `[${i.source}] ${i.content}`);

  // 生成研判文本
  const verdictTemplates = [
    `多源验证：${stockId} 短期走势偏多，建议重点关注`,
    `交叉确认：${stockId} 近期可能有较大波动，注意风险与机会`,
    `情报汇总：${stockId} 基本面和消息面均指向同一方向`,
    `综合研判：${stockId} 的多条信息相互印证，确信度较高`,
  ];
  const verdict = verdictTemplates[Math.floor(Math.random() * verdictTemplates.length)];

  return {
    stockId,
    sources: Array.from(sources),
    combinedAccuracy,
    verdict,
    details,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/managers/InfoManager.ts
git commit -m "feat: add chain verdict generation to InfoManager"
```

---

### Task 2: 创建情报串联弹窗组件

**Files:**
- Create: `src/ui/IntelChainPopup.ts`

- [ ] **Step 1: 编写 IntelChainPopup**

```typescript
// src/ui/IntelChainPopup.ts

import Phaser from 'phaser';
import { THEME } from './theme';
import { CardFactory } from './CardFactory';
import type { ChainVerdict } from '../managers/InfoManager';

export class IntelChainPopup extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    verdict: ChainVerdict,
    onDismiss: () => void,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(900);

    // 半透明遮罩
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0).setInteractive();
    this.add(overlay);

    // 弹窗卡片
    const cardW = width - 48;
    const cardH = 320;
    const cardX = 24;
    const cardY = (height - cardH) / 2;

    // 卡片背景（金色边框突显重要性）
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);
    this.add(bg);

    // 顶部标题
    const titleY = cardY + 28;
    this.add(scene.add.text(width / 2, titleY, '🔗 情报串联触发！', {
      fontSize: '20px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5));

    // 股票ID
    this.add(scene.add.text(width / 2, titleY + 32, verdict.stockId, {
      fontSize: '18px', color: '#4a90d9', fontFamily: THEME.font.mono,
    }).setOrigin(0.5));

    // 确信度
    const accPercent = Math.round(verdict.combinedAccuracy * 100);
    this.add(scene.add.text(width / 2, titleY + 58, `综合确信度: ${accPercent}%`, {
      fontSize: '14px', color: '#2ecc71', fontFamily: THEME.font.mono,
    }).setOrigin(0.5));

    // 来源标签
    const sourcesStr = verdict.sources.map(s => `「${s}」`).join(' + ');
    this.add(scene.add.text(width / 2, titleY + 82, sourcesStr, {
      fontSize: '11px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      wordWrap: { width: cardW - 32 }, align: 'center',
    }).setOrigin(0.5));

    // 分隔线
    const dividerY = titleY + 106;
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0xffd700, 0.3);
    divider.lineBetween(cardX + 20, dividerY, cardX + cardW - 20, dividerY);
    this.add(divider);

    // 综合研判
    this.add(scene.add.text(cardX + 20, dividerY + 16, '📋 综合研判', {
      fontSize: '13px', color: '#ffd700', fontFamily: THEME.font.primary,
    }));
    this.add(scene.add.text(cardX + 20, dividerY + 40, verdict.verdict, {
      fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      wordWrap: { width: cardW - 40 },
    }));

    // 信息明细（滚动列表简化为最多显示3条）
    let detailY = dividerY + 76;
    const maxDetails = Math.min(verdict.details.length, 3);
    for (let i = 0; i < maxDetails; i++) {
      this.add(scene.add.text(cardX + 20, detailY, `• ${verdict.details[i]}`, {
        fontSize: '11px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
        wordWrap: { width: cardW - 40 },
      }));
      detailY += 22;
    }

    // 确认按钮
    const btnY = cardY + cardH - 36;
    CardFactory.createButton(
      scene, width / 2, btnY, 160, 40,
      '✅ 知道了', {
        color: 0xffd700,
        onClick: () => {
          this.destroy();
          onDismiss();
        },
      },
    );

    // 入场动画
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 300, ease: 'Power2' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/IntelChainPopup.ts
git commit -m "feat: add IntelChainPopup component for intelligence chain display"
```

---

### Task 3: 在 PostMarketScene 中集成情报串联弹窗

**Files:**
- Modify: `src/scenes/PostMarketScene.ts:149-168`

- [ ] **Step 1: 导入新组件**

在文件顶部添加导入：

```typescript
import { IntelChainPopup } from '../ui/IntelChainPopup';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
```

- [ ] **Step 2: 修改 showNextEvent 中的情报串联处理**

将原来的纯文字提示替换为弹窗展示。修改 `showNextEvent()` 中事件回调部分：

```typescript
// src/scenes/PostMarketScene.ts — showNextEvent() 中的事件回调

new EventCard(this, GAME_WIDTH / 2, 90, GAME_WIDTH - 40, event, (result) => {
  this.eventResults.push(result);
  this.totalSpending += result.cost;

  if (result.gotInfo) {
    const gm = getGameManager(this);
    const state = gm.state.getState();
    const info = gm.info.generateInfo(
      this.selectedScene!.id,
      result.infoAccuracy,
      state.currentDay,
    );
    if (info) {
      gm.info.addInfo(info);
      gm.state.addInfo(info);

      // 🔧 FIX: 情报串联检查 — 弹出专门面板而非纯文字
      if (gm.info.checkChain(info.stockId)) {
        const verdict = gm.info.generateChainVerdict(info.stockId);
        if (verdict) {
          new IntelChainPopup(this, GAME_WIDTH, GAME_HEIGHT, verdict, () => {
            this.handleSpecialEffect(result.message);
            this.time.delayedCall(300, () => this.showNextEvent());
          });
          return; // 等待弹窗关闭后再继续
        }
      }
    }
  }

  this.handleSpecialEffect(result.message);
  this.time.delayedCall(300, () => this.showNextEvent());
});
```

- [ ] **Step 3: 手动验证**

1. 进入盘后场景，选择一个会给信息的场景（如大排档）
2. 多次进入同一类场景获取关于同一支股票的信息
3. 当情报串联触发时，确认金色边框弹窗出现
4. 确认弹窗显示：股票ID、来源列表、确信度、综合研判
5. 点击"知道了"后正常继续

- [ ] **Step 4: Commit**

```bash
git add src/scenes/PostMarketScene.ts
git commit -m "feat: integrate IntelChainPopup in PostMarketScene"
```

---

### Task 4: 增强 InfoPanel 中已串联股票的视觉标记

**Files:**
- Modify: `src/ui/InfoPanel.ts`

- [ ] **Step 1: 查看当前 InfoPanel 实现**

当前 `InfoPanel` 接收 `chainedStocks: string[]` 参数（PreMarketScene L126）。需要确认已串联的股票在信息列表中有明显的金色标记。

```typescript
// src/ui/InfoPanel.ts — 在渲染信息列表时，为已串联股票添加标记

// 在每条信息渲染逻辑中检查是否属于已串联股票：
const isChained = chainedStocks.includes(info.stockId);

// 如果已串联，在该条信息前添加金色 🔗 标记和背景高亮
if (isChained) {
  // 金色背景条
  const highlight = scene.add.rectangle(0, y, width, 28, 0xffd700, 0.08).setOrigin(0, 0);
  container.add(highlight);

  // 🔗 标记
  const chainTag = scene.add.text(width - 16, y + 4, '🔗 已验证', {
    fontSize: '10px', color: '#ffd700', fontFamily: THEME.font.primary,
  }).setOrigin(1, 0);
  container.add(chainTag);
}
```

- [ ] **Step 2: 在 InfoPanel 底部增加串联统计**

```typescript
// 在信息列表底部，显示串联统计
if (chainedStocks.length > 0) {
  const summaryTxt = scene.add.text(width / 2, bottomY + 20,
    `🔗 已串联验证: ${chainedStocks.length}支股票`, {
    fontSize: '13px', color: '#ffd700', fontFamily: THEME.font.primary,
  }).setOrigin(0.5);
  container.add(summaryTxt);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/InfoPanel.ts
git commit -m "feat: enhance chained stock visual markers in InfoPanel"
```

---

### Task 5: 修正书店手续费减半天数

**Files:**
- Modify: `src/data/scenes.ts:181-183`
- Modify: `src/scenes/PostMarketScene.ts:173-177`

- [ ] **Step 1: 修改书店事件的 specialEffect 文本**

设计规格§6.3："去书店可将手续费减半至0.5%（持续5天）"

```typescript
// src/data/scenes.ts — book-01 事件

{
  id: 'book-01', sceneId: 'bookstore',
  description: '看到一本《聪明的投资者》', emoji: '📖',
  optionA: { label: '买下来 ¥60', cost: 60, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半5天' },
  optionB: { label: '站着翻翻', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半2天' },
},
```

同时修改书店场景描述：

```typescript
// src/data/scenes.ts — bookstore SceneConfig
{
  id: 'bookstore',
  name: '书店',
  emoji: '📚',
  cost: 100,
  minMood: MoodLevel.SAD,
  infoDescription: '翻阅投资书籍，手续费减半5天',
  infoAccuracy: -1,
},
```

- [ ] **Step 2: 修改 PostMarketScene 的特殊效果解析**

```typescript
// src/scenes/PostMarketScene.ts — handleSpecialEffect() 方法

private handleSpecialEffect(message: string): void {
  const gm = getGameManager(this);
  // 匹配 "手续费减半N天" 模式
  const match = message.match(/手续费减半(\d+)天/);
  if (match) {
    const days = parseInt(match[1]);
    gm.state.setCommissionDiscount(days);
  }
}
```

- [ ] **Step 3: 手动验证**

1. 进入盘后场景，选择书店
2. 事件中选择"买下来"
3. 下一天盘前确认手续费显示为减半
4. 持续5天后确认恢复正常

- [ ] **Step 4: Commit**

```bash
git add src/data/scenes.ts src/scenes/PostMarketScene.ts
git commit -m "fix: bookstore commission discount from 3 days to 5 days per spec"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计§5.1第三层"情报串联…给出高确信度（~90%准确）的综合研判" — IntelChainPopup + generateChainVerdict(combinedAccuracy≈0.9) ✅
- [x] **Spec coverage:** 设计§6.3"去书店可将手续费减半至0.5%（持续5天）" — book-01 改为5天 ✅
- [x] **Placeholder scan:** 无 TBD/TODO ✅
- [x] **Type consistency:** ChainVerdict 接口在 InfoManager 中定义，IntelChainPopup 正确引用 ✅
- [x] **handleSpecialEffect:** 改用正则匹配，兼容任意天数，不再硬编码 ✅
