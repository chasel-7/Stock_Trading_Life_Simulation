# Phase 2: 场景卡片 UI 改造 + 情报串联增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the DECISION phase to support multi-card scene events with A/B choices, and enhance the intel linking system with confidence stars and toast notifications.

**Architecture:** The `selectScene` function now draws 1~3 event cards from the scene pool (Phase 1). A new `SCENE_CARDS` phase renders cards one at a time. After all cards are processed, the player proceeds to day settlement. Intel linking is enhanced with star ratings in the existing notebook display.

**Tech Stack:** React, Zustand, Vanilla CSS

**Depends on:** Phase 1 (sceneEvents.js must exist)

---

### Task 1: Add New State Variables for Scene Cards

**Files:**
- Modify: `frontend/src/App.jsx` (around line 180-200, state declarations)

- [ ] **Step 1: Add state for scene card flow**

In `frontend/src/App.jsx`, find the state declarations section (around line 180-200). Add these new state variables:

```js
const [sceneEventCards, setSceneEventCards] = useState([]);     // 当前场景抽到的事件卡片
const [currentCardIndex, setCurrentCardIndex] = useState(0);   // 当前展示的卡片索引
const [cardResults, setCardResults] = useState([]);             // 每张卡片的选择结果文字
const [showCardResult, setShowCardResult] = useState(false);    // 是否正在展示选择结果
```

Also add the import at the top of the file (around line 1-10):

```js
import { SCENE_EVENTS, drawSceneEvents } from './data/sceneEvents';
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds (unused variables warning is OK at this point).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add scene card state variables and import sceneEvents"
```

---

### Task 2: Rewrite selectScene to Draw Event Cards

**Files:**
- Modify: `frontend/src/App.jsx` — the `selectScene` function (around line 445-458)

- [ ] **Step 1: Update selectScene to draw cards and set SCENE_CARDS phase**

Replace the existing `selectScene` function with:

```js
const selectScene = (scene) => {
    const isSales = store.roleType === 'sales_manager';
    const actualCost = isSales ? scene.cost * 0.8 : scene.cost;

    if (actualCost > 0 && store.cash < actualCost) {
        toast.show("流动现金余额不足，无法进入该消费场景！", "warning");
        return;
    }

    // 扣除场景基础费用
    store.addSceneSpend(scene.name, actualCost);

    // 从事件池抽取卡片
    const drawnCards = drawSceneEvents(scene.name);

    setSelectedScene({ ...scene, cost: actualCost });
    setSceneEventCards(drawnCards);
    setCurrentCardIndex(0);
    setCardResults([]);
    setShowCardResult(false);

    if (drawnCards.length > 0) {
        setPhase('SCENE_CARDS');
    } else {
        // 该场景无事件池（不应该发生），直接进入结算
        handleSceneCardsComplete(scene.name);
    }
};
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build error about `handleSceneCardsComplete` not being defined — this is expected. Will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: rewrite selectScene to draw event cards from pool"
```

---

### Task 3: Implement Card Choice Handler and Scene Completion

**Files:**
- Modify: `frontend/src/App.jsx` — add new functions after `selectScene`

- [ ] **Step 1: Add handleCardChoice and handleSceneCardsComplete**

Add these functions after the `selectScene` function:

```js
const handleCardChoice = (option) => {
    const card = sceneEventCards[currentCardIndex];
    let resultText = "";

    // 处理额外花费
    if (option.cost && option.cost > 0) {
        if (store.cash < option.cost) {
            toast.show(`现金不足 ¥${option.cost}，无法选择此选项！`, "warning");
            return;
        }
        store.addSceneSpend(`${card.title} 额外花费`, option.cost);
    }

    switch (option.effect) {
        case "info": {
            // 从 intelligence 数据中选一条情报，根据 infoQuality 决定准确度
            if (marketData && marketData.intelligence && marketData.intelligence.length > 0) {
                const intelIdx = (card.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + store.day + currentCardIndex) % marketData.intelligence.length;
                const intel = marketData.intelligence[intelIdx];
                const isAccurate = Math.random() < (option.infoQuality || 0.5);

                let text, type;
                if (isAccurate) {
                    // 准确情报：方向正确
                    type = intel.direction === "up" ? "positive" : intel.direction === "down" ? "negative" : "neutral";
                    text = intel.direction === "up"
                        ? `从【${card.title}】获悉，${intel.stock} 近期可能迎来一波【${intel.trend}】！`
                        : intel.direction === "down"
                        ? `从【${card.title}】得知，${intel.stock} 近期面临利空，预计【${intel.trend}】。`
                        : `从【${card.title}】听闻，${intel.stock} 多空交织，走势以【${intel.trend}】为主。`;
                } else {
                    // 不准确：方向可能反转
                    const fakeDirections = ["up", "down", "flat"];
                    const fakeDir = fakeDirections[Math.floor(Math.random() * 3)];
                    type = fakeDir === "up" ? "positive" : fakeDir === "down" ? "negative" : "neutral";
                    const fakeTrend = fakeDir === "up" ? "可能上涨" : fakeDir === "down" ? "可能下跌" : "震荡整理";
                    text = `从【${card.title}】听到传闻，${intel.stock} 近期${fakeTrend}。（消息来源不太可靠）`;
                }

                store.addInfoHint({
                    stock: intel.stock,
                    source: selectedScene?.name || card.title,
                    text: text,
                    type: type,
                    quality: option.infoQuality || 0.5,
                });

                // 情报串联检查
                checkIntelLinking(intel.stock);

                resultText = `📋 获得情报：${text}`;
            } else {
                resultText = "今晚没有打听到什么有用的消息。";
            }
            break;
        }
        case "buff": {
            if (option.buffType === "fee_half_5d") {
                store.setBookstoreBuff(5);
                resultText = "📖 你获得了「手续费减半」buff，持续 5 个交易日！";
            } else if (option.buffType === "double_salary") {
                store.setDoubleSalaryTomorrow(true);
                resultText = "💼 明天你将获得双倍日薪！虽然牺牲了社交时间，但钱包会更鼓。";
            } else if (option.buffType === "reduce_neg_event") {
                store.setReduceNegEvent(true);
                resultText = "🎤 你唱得太嗨了！明天的负面事件概率将大幅降低。";
            }
            break;
        }
        case "money": {
            const delta = option.moneyDelta || 0;
            if (delta !== 0) {
                store.addSceneSpend(card.title, -delta); // 负的 spend = 收入
                resultText = delta > 0
                    ? `💰 你获得了 ¥${delta}！`
                    : `💸 你花费了 ¥${Math.abs(delta)}。`;
            }
            break;
        }
        case "gamble": {
            const won = Math.random() < (option.winChance || 0.5);
            if (won) {
                store.addSceneSpend(`${card.title} 赌赢`, -(option.winAmount || 0));
                resultText = `🎉 手气不错！你赢了 ¥${option.winAmount}！`;
            } else {
                resultText = `😢 可惜，这次运气不太好。你损失了赌注 ¥${option.cost || 0}。`;
            }
            break;
        }
        case "hint": {
            resultText = option.hintText || "💭 你获得了一些人生感悟。";
            break;
        }
        case "none":
        default: {
            resultText = "你选择了按兵不动，什么也没有发生。";
            break;
        }
    }

    // 展示结果
    setCardResults(prev => [...prev, { card: card.title, choice: option.text, result: resultText }]);
    setShowCardResult(true);

    // 0.8s 后切到下一张或完成
    setTimeout(() => {
        setShowCardResult(false);
        if (currentCardIndex + 1 < sceneEventCards.length) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            handleSceneCardsComplete(selectedScene?.name);
        }
    }, 1200);
};

const handleSceneCardsComplete = (sceneName) => {
    // 场景事件全部完成，进入日结算
    if (store.day === 15) {
        store.nextDay();
        if (store.cash < 0) {
            const currentPricesMap = {};
            if (marketData && marketData.stocks) {
                marketData.stocks.forEach((s) => {
                    currentPricesMap[s] = marketData.prices[s]?.[tick] || marketData.bounds[s]?.open || 10.0;
                });
            } else {
                Object.keys(store.holdings).forEach(s => { currentPricesMap[s] = 10.0; });
            }
            const res = store.runAutoLiquidation(currentPricesMap);
            if (!res.success) {
                toast.show("第 15 天平仓结束后现金依然低于 0，系统判定破产！", "error", 5000);
            }
        }
        performSettlement(true);
    } else {
        transitionToNextDay();
    }
};

const checkIntelLinking = (stock) => {
    const infos = store.gatheredInfo.filter(i => i.stock === stock);
    const sources = new Set(infos.map(i => i.source));
    if (sources.size >= 2) {
        const stars = sources.size >= 3 ? "⭐⭐⭐" : "⭐⭐";
        toast.show(`💡 情报串联触发！【${stock}】已获 ${sources.size} 条不同来源，置信度 ${stars}`, "success", 4000);
    }
};
```

- [ ] **Step 2: Add missing store actions**

In `frontend/src/store/useGameStore.js`, add these actions to the store (after existing actions like `setTickRateMultiplier`):

```js
setBookstoreBuff: (days) => set({ bookstoreDaysLeft: days }),
setDoubleSalaryTomorrow: (flag) => set({ doubleSalaryTomorrow: flag || false }),
setReduceNegEvent: (flag) => set({ reduceNegEvent: flag || false }),
```

Also add the initial state fields (around line 34):

```js
doubleSalaryTomorrow: false,
reduceNegEvent: false,
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/store/useGameStore.js
git commit -m "feat: implement card choice handler with info/buff/gamble/hint effects + intel linking"
```

---

### Task 4: Remove Old DECISION Phase and confirmScene

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Remove old confirmScene function**

Delete the entire `confirmScene` function (around line 460-541). It is no longer needed — the scene spending and intel logic is now handled by `selectScene` (base cost) + `handleCardChoice` (per-card effects).

- [ ] **Step 2: Remove old DECISION phase JSX**

Find and remove the JSX block for `phase === 'DECISION'` (around line 950-957):

```jsx
{phase === 'DECISION' && selectedScene && (
    <DecisionCard
        sceneName={selectedScene.name}
        cost={selectedScene.cost}
        description={selectedScene.desc}
        onConfirm={confirmScene}
    />
)}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "refactor: remove old DECISION phase and confirmScene in favor of SCENE_CARDS"
```

---

### Task 5: Rewrite DecisionCard for Multi-Card Display

**Files:**
- Modify: `frontend/src/components/DecisionCard.jsx`

- [ ] **Step 1: Rewrite DecisionCard as SceneCardPlayer**

Replace the entire content of `frontend/src/components/DecisionCard.jsx`:

```jsx
import React from 'react';

/**
 * SceneCardPlayer — 场景事件卡片翻牌 UI
 * 逐张展示事件卡片，每张有 A/B 两个选项。选择后显示结果文字。
 */
export default function DecisionCard({
    sceneName,
    cards,
    currentIndex,
    onChoice,
    showResult,
    resultText,
    cardResults,
    isComplete,
    onFinish,
}) {
    // 全部完成 → 汇总页
    if (isComplete) {
        return (
            <div className="game-card" style={{ padding: '24px', maxWidth: '460px', margin: '30px auto', textAlign: 'center', animation: 'cardDrop 0.35s ease forwards' }}>
                <h4 style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)', fontSize: '18px', margin: '0 0 16px 0' }}>
                    🌙 {sceneName} — 事件结束
                </h4>
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    {cardResults.map((r, i) => (
                        <div key={i} style={{
                            padding: '10px 12px',
                            marginBottom: '8px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: '3px solid var(--amber)',
                            fontSize: '12px',
                            lineHeight: '1.5',
                        }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                {r.card} → <span style={{ color: 'var(--text-primary)' }}>{r.choice}</span>
                            </div>
                            <div style={{ color: 'var(--amber)' }}>{r.result}</div>
                        </div>
                    ))}
                </div>
                <button className="btn-arcade" onClick={onFinish} style={{ width: '100%', padding: '12px', fontSize: '15px' }}>
                    🌙 结束今天
                </button>
            </div>
        );
    }

    const card = cards[currentIndex];
    if (!card) return null;

    // 正在展示选择结果
    if (showResult) {
        return (
            <div className="game-card" style={{ padding: '24px', maxWidth: '460px', margin: '30px auto', textAlign: 'center', animation: 'cardDrop 0.25s ease forwards' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', marginBottom: '12px' }}>
                    {sceneName} · 卡片 {currentIndex + 1}/{cards.length}
                </div>
                <div style={{ padding: '20px', background: 'rgba(240, 180, 41, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--amber)' }}>
                    <div style={{ fontSize: '14px', color: 'var(--amber)', lineHeight: '1.6' }}>
                        {resultText}
                    </div>
                </div>
            </div>
        );
    }

    // 展示事件卡片
    return (
        <div className="game-card" style={{ padding: '24px', maxWidth: '460px', margin: '30px auto', textAlign: 'center', animation: 'cardDrop 0.35s ease forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
                    {sceneName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', background: 'var(--bg-elevated)', padding: '3px 8px', borderRadius: '10px' }}>
                    {currentIndex + 1} / {cards.length}
                </span>
            </div>
            <h4 style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)', fontSize: '17px', margin: '0 0 10px 0' }}>
                {card.title}
            </h4>
            <div className="speech-bubble">
                <p style={{ fontSize: '13px', lineHeight: '1.7', textAlign: 'left', color: 'var(--text-primary)' }}>{card.desc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {card.options.map((opt, oi) => (
                    <button
                        key={oi}
                        className={oi === 0 ? "btn-jade" : "btn-outline"}
                        onClick={() => onChoice(opt)}
                        style={{ padding: '11px 16px', fontSize: '13px', textAlign: 'left', width: '100%' }}
                    >
                        {oi === 0 ? '🅰️ ' : '🅱️ '}{opt.text}
                        {opt.cost > 0 && <span style={{ color: 'var(--crimson)', fontFamily: 'var(--font-data)', marginLeft: '6px' }}>-¥{opt.cost}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DecisionCard.jsx
git commit -m "feat: rewrite DecisionCard as multi-card scene event player"
```

---

### Task 6: Add SCENE_CARDS Phase JSX

**Files:**
- Modify: `frontend/src/App.jsx` — the JSX return section

- [ ] **Step 1: Add SCENE_CARDS phase rendering**

Where the old `phase === 'DECISION'` JSX was, add:

```jsx
{phase === 'SCENE_CARDS' && sceneEventCards.length > 0 && (
    <DecisionCard
        sceneName={selectedScene?.name || ''}
        cards={sceneEventCards}
        currentIndex={currentCardIndex}
        onChoice={handleCardChoice}
        showResult={showCardResult}
        resultText={cardResults[cardResults.length - 1]?.result || ''}
        cardResults={cardResults}
        isComplete={!showCardResult && currentCardIndex >= sceneEventCards.length && cardResults.length >= sceneEventCards.length}
        onFinish={() => handleSceneCardsComplete(selectedScene?.name)}
    />
)}
```

Note on the `isComplete` logic: it checks that all cards have been processed (cardResults length matches cards length) AND we're not mid-result-display AND currentCardIndex has advanced past the last card.

Actually, a simpler approach: track completion as a derived state. When `cardResults.length === sceneEventCards.length && !showCardResult`, show the summary. The `handleCardChoice` already advances `currentCardIndex` after the timeout. So use:

```jsx
{phase === 'SCENE_CARDS' && sceneEventCards.length > 0 && (
    <DecisionCard
        sceneName={selectedScene?.name || ''}
        cards={sceneEventCards}
        currentIndex={currentCardIndex}
        onChoice={handleCardChoice}
        showResult={showCardResult}
        resultText={cardResults.length > 0 ? cardResults[cardResults.length - 1].result : ''}
        cardResults={cardResults}
        isComplete={cardResults.length === sceneEventCards.length && !showCardResult}
        onFinish={() => handleSceneCardsComplete(selectedScene?.name)}
    />
)}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add SCENE_CARDS phase rendering with multi-card player"
```

---

### Task 7: Enhance Intel Notebook with Confidence Stars

**Files:**
- Modify: `frontend/src/App.jsx` (lines 836-866, intel notebook)
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Update the intel synthesis display with stars**

Replace the intel notebook rendering (around line 836-866) with:

```jsx
{/* 情报笔记本 */}
<div className="game-card--static" style={{ padding: '15px', marginTop: '15px' }}>
    <h4 className="section-title" style={{ fontSize: '14px' }}>📓 情报笔记本</h4>
    <div className="info-notebook">
        {/* 情报串联 */}
        {(() => {
            const grouped = {};
            store.gatheredInfo.forEach(info => {
                if (!grouped[info.stock]) grouped[info.stock] = [];
                grouped[info.stock].push(info);
            });

            const syntheses = [];
            Object.entries(grouped).forEach(([stock, items]) => {
                const sources = new Set(items.map(i => i.source));
                if (sources.size >= 2) {
                    const stars = sources.size >= 3 ? "⭐⭐⭐" : "⭐⭐";
                    const confidence = sources.size >= 3 ? "高置信度" : "中置信度";
                    syntheses.push(
                        <div key={stock} className="info-synthesis info-synthesis--active">
                            💡 <strong>【情报串联 · {stock}】</strong>
                            <span className="confidence-badge">{stars} {confidence}</span>
                            <br />
                            经 {Array.from(sources).join(' & ')} 交叉研判，多条线索指向同一方向。
                        </div>
                    );
                }
            });

            return syntheses.length > 0 ? syntheses : null;
        })()}

        {store.gatheredInfo.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px 0' }}>暂无盘后情报，多去社交场景收集线索吧。</div>
        ) : (
            store.gatheredInfo.map((info, idx) => {
                const qualityStars = info.quality >= 0.8 ? '⭐' : '';
                return (
                    <div key={idx} className="info-entry">
                        🔍 <span className="info-source-badge">{info.source}</span>
                        <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>{info.stock}</span>: {info.text}
                        {qualityStars && <span style={{ marginLeft: '4px' }}>{qualityStars}</span>}
                    </div>
                );
            })
        )}
    </div>
</div>
```

- [ ] **Step 2: Add CSS for synthesis animation and badges**

In `frontend/src/index.css`, add:

```css
.info-synthesis--active {
    animation: synthesisPulse 2s ease-in-out infinite;
    border: 1px solid var(--amber);
    background: rgba(240, 180, 41, 0.06);
}

@keyframes synthesisPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(240, 180, 41, 0.1); }
    50% { box-shadow: 0 0 12px 2px rgba(240, 180, 41, 0.15); }
}

.confidence-badge {
    display: inline-block;
    font-size: 11px;
    margin-left: 6px;
    padding: 2px 6px;
    border-radius: 8px;
    background: rgba(240, 180, 41, 0.1);
    color: var(--amber);
    font-family: var(--font-data);
}

.info-source-badge {
    display: inline-block;
    font-size: 10px;
    padding: 1px 5px;
    margin-right: 4px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
    font-family: var(--font-data);
}

.btn-outline {
    background: transparent;
    border: 1.5px solid var(--border-card);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}
.btn-outline:hover {
    border-color: var(--amber);
    background: rgba(240, 180, 41, 0.04);
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/index.css
git commit -m "feat: intel notebook confidence stars + synthesis pulse animation + btn-outline style"
```

---

### Task 8: Wire Up Buff Effects in Game Store

**Files:**
- Modify: `frontend/src/store/useGameStore.js` — the `nextDay` function
- Modify: `frontend/src/App.jsx` — life event trigger

- [ ] **Step 1: Apply double salary buff in nextDay**

In `useGameStore.js`, find the `nextDay` action. After salary is applied, check and reset the double salary buff:

In the salary calculation section, wrap the existing salary logic:

```js
// Inside nextDay, where salary is applied:
let dailySalary = /* existing salary calculation */;
if (state.doubleSalaryTomorrow) {
    dailySalary *= 2;
}
```

And at the end of the `nextDay` set call, reset the buff:

```js
doubleSalaryTomorrow: false,
```

- [ ] **Step 2: Apply reduce_neg_event buff in life event trigger**

In `App.jsx`, in the `transitionToNextDay` function, after the trigger rate is calculated:

```js
let triggerRate = roleProbabilities[store.roleType] || 0.20;
if (store.reduceNegEvent) {
    triggerRate *= 0.3; // 降低 70%
    store.setReduceNegEvent(false); // 一次性 buff
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/store/useGameStore.js
git commit -m "feat: wire up double_salary and reduce_neg_event buffs from scene cards"
```

---

### Task 9: End-to-End Smoke Test

- [ ] **Step 1: Run dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Manual test flow**

1. Login → Choose role → Start solo practice
2. Skip through trading → Enter NIGHT phase
3. Select a scene → Verify event cards appear (1~3 cards)
4. Choose options on each card → Verify result text shows
5. After all cards → Verify summary page shows
6. Click "结束今天" → Verify day transition works
7. Check intel notebook → Verify info hints with source badges
8. Collect 2+ intel from same stock on different days → Verify synthesis with stars appears

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete scene cards system + intel linking enhancement"
```
