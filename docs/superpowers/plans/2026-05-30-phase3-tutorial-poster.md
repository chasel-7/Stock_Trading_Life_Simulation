# Phase 3: 新手引导 + 分享海报 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight tooltip tutorial overlay for Day 1 first-time players, and a share poster feature using html2canvas for the settlement screen.

**Architecture:** TutorialOverlay is a standalone component controlled by localStorage flag. SharePoster uses html2canvas to screenshot a hidden poster div and displays it in a modal. Both are independent features with no shared state.

**Tech Stack:** React, html2canvas, Vanilla CSS

**Depends on:** Phase 2 (complete game flow for tutorial to reference)

---

### Task 1: Create Tutorial Overlay Component

**Files:**
- Create: `frontend/src/components/TutorialOverlay.jsx`

- [ ] **Step 1: Create the TutorialOverlay component**

Create `frontend/src/components/TutorialOverlay.jsx`:

```jsx
import React, { useState, useEffect, useCallback } from 'react';

const TUTORIAL_STEPS = [
    {
        id: 'watchlist',
        targetSelector: '.watchlist-container',
        text: '👆 这是你的自选股列表，点击任意一支查看实时走势和详情。',
        position: 'bottom',
        trigger: 'phase:TRADE',
    },
    {
        id: 'kline',
        targetSelector: '.kline-chart-container',
        text: '📈 这里显示该股的分时走势图。顶部可以切换「分时」和「日K」蜡烛图。',
        position: 'bottom',
        trigger: 'action:selectStock',
    },
    {
        id: 'buy',
        targetSelector: '.trade-controls',
        text: '💰 点这里买入或卖出。你可以选择全仓、半仓或 1/4 仓。每笔交易收取 1% 手续费。',
        position: 'top',
        trigger: 'action:viewKline',
    },
    {
        id: 'notebook',
        targetSelector: '.info-notebook',
        text: '📓 盘后社交获取的情报会显示在这里。同一只股票获得 2 条以上不同来源的情报可以触发「情报串联」！',
        position: 'top',
        trigger: 'action:firstTrade',
    },
    {
        id: 'night',
        targetSelector: '.grid-2col',
        text: '🌃 根据今天收益率解锁不同场景。高消费场景可获取更可靠的情报，但也意味着更多花销。所有选择都有价格。',
        position: 'bottom',
        trigger: 'phase:NIGHT',
    },
    {
        id: 'complete',
        targetSelector: null,
        text: '🎓 引导完成！接下来的 15 个交易日由你自己掌控。记住：不嘲笑你，只让你旁观自己。祝你好运！',
        position: 'center',
        trigger: 'action:firstScene',
    },
];

const STORAGE_KEY = 'stock_life_tutorial_complete';

export default function TutorialOverlay({ currentStep, onNext, onSkip }) {
    const [targetRect, setTargetRect] = useState(null);

    const step = TUTORIAL_STEPS[currentStep];

    const updateTargetRect = useCallback(() => {
        if (!step || !step.targetSelector) {
            setTargetRect(null);
            return;
        }
        const el = document.querySelector(step.targetSelector);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect({
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
            });
        }
    }, [step]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        return () => window.removeEventListener('resize', updateTargetRect);
    }, [updateTargetRect, currentStep]);

    if (!step) return null;

    const isCenter = step.position === 'center' || !targetRect;

    return (
        <div className="tutorial-overlay">
            {/* 半透明遮罩 + 开孔 */}
            {targetRect && (
                <div
                    className="tutorial-mask"
                    style={{
                        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`,
                        position: 'fixed',
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        borderRadius: '8px',
                        zIndex: 9998,
                        pointerEvents: 'none',
                    }}
                />
            )}
            {!targetRect && (
                <div className="tutorial-mask-full" style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    zIndex: 9998, pointerEvents: 'none',
                }} />
            )}

            {/* 气泡 */}
            <div
                className="tutorial-tooltip"
                style={{
                    position: 'fixed',
                    zIndex: 9999,
                    ...(isCenter ? {
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                    } : step.position === 'bottom' ? {
                        top: (targetRect?.top || 0) + (targetRect?.height || 0) + 12,
                        left: Math.max(16, (targetRect?.left || 0)),
                        maxWidth: '320px',
                    } : {
                        bottom: window.innerHeight - (targetRect?.top || 0) + 12,
                        left: Math.max(16, (targetRect?.left || 0)),
                        maxWidth: '320px',
                    }),
                }}
            >
                <div className="tutorial-text">{step.text}</div>
                <div className="tutorial-actions">
                    <button className="tutorial-skip" onClick={onSkip}>跳过引导</button>
                    <button className="tutorial-next" onClick={onNext}>
                        {currentStep < TUTORIAL_STEPS.length - 1 ? '下一步 →' : '开始游戏 🚀'}
                    </button>
                </div>
                <div className="tutorial-progress">
                    {TUTORIAL_STEPS.map((_, i) => (
                        <span key={i} className={`tutorial-dot ${i <= currentStep ? 'tutorial-dot--active' : ''}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export { TUTORIAL_STEPS, STORAGE_KEY };
```

- [ ] **Step 2: Add tutorial CSS**

In `frontend/src/index.css`, add:

```css
/* Tutorial Overlay */
.tutorial-overlay {
    position: fixed;
    inset: 0;
    z-index: 9997;
}
.tutorial-tooltip {
    background: var(--bg-card);
    border: 2px solid var(--amber);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(240, 180, 41, 0.1);
    max-width: 340px;
    animation: cardDrop 0.3s ease forwards;
}
.tutorial-text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-primary);
    margin-bottom: 14px;
}
.tutorial-actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}
.tutorial-skip {
    background: transparent;
    border: 1px solid var(--border-card);
    color: var(--text-muted);
    padding: 7px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
}
.tutorial-next {
    background: var(--amber);
    color: var(--bg-primary);
    border: none;
    padding: 7px 18px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
}
.tutorial-progress {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 12px;
}
.tutorial-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--border-card);
}
.tutorial-dot--active {
    background: var(--amber);
}
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/TutorialOverlay.jsx frontend/src/index.css
git commit -m "feat: create TutorialOverlay component with tooltip steps and CSS"
```

---

### Task 2: Integrate Tutorial into App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add tutorial state and rendering**

Add import:
```js
import TutorialOverlay, { TUTORIAL_STEPS, STORAGE_KEY } from './components/TutorialOverlay';
```

Add state (with other state declarations):
```js
const [tutorialStep, setTutorialStep] = useState(-1); // -1 = inactive
```

Add initialization logic (inside a useEffect or after login):
```js
useEffect(() => {
    if (store.isPlaying && store.day === 1 && !localStorage.getItem(STORAGE_KEY)) {
        setTutorialStep(0);
    }
}, [store.isPlaying, store.day]);
```

Add tutorial advancement functions:
```js
const advanceTutorial = () => {
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
        setTutorialStep(-1);
        localStorage.setItem(STORAGE_KEY, 'true');
    } else {
        setTutorialStep(prev => prev + 1);
    }
};
const skipTutorial = () => {
    setTutorialStep(-1);
    localStorage.setItem(STORAGE_KEY, 'true');
};
```

Add rendering (inside the main return, before the closing `</div>`):
```jsx
{tutorialStep >= 0 && (
    <TutorialOverlay
        currentStep={tutorialStep}
        onNext={advanceTutorial}
        onSkip={skipTutorial}
    />
)}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: integrate tutorial overlay into game flow"
```

---

### Task 3: Install html2canvas

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install html2canvas**

Run: `cd frontend && npm install html2canvas`

- [ ] **Step 2: Verify installation**

Run: `cd frontend && npm run build`
Expected: Build succeeds, html2canvas added to package.json.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add html2canvas dependency for share poster"
```

---

### Task 4: Create SharePoster Component

**Files:**
- Create: `frontend/src/components/SharePoster.jsx`

- [ ] **Step 1: Create SharePoster component**

Create `frontend/src/components/SharePoster.jsx`:

```jsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import RadarChart from './RadarChart';

export default function SharePoster({ metrics, profitRate, title, roleName, day, onClose }) {
    const posterRef = useRef(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [generating, setGenerating] = useState(false);

    const generatePoster = async () => {
        if (!posterRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(posterRef.current, {
                backgroundColor: '#0D0F14',
                scale: 2,
                useCORS: true,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);
        } catch (err) {
            console.error('Failed to generate poster:', err);
        }
        setGenerating(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '20px', maxWidth: '380px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                {!imageUrl ? (
                    <>
                        {/* 海报内容 (用于截图) */}
                        <div ref={posterRef} style={{ padding: '24px', background: '#0D0F14', borderRadius: '12px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🕹️</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#E8A317' }}>股票人生模拟器</div>
                                <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(229,221,208,0.4)', letterSpacing: '0.15em' }}>STOCK LIFE ARCADE</div>
                            </div>

                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(229,221,208,0.5)', marginBottom: '4px' }}>最终收益率</div>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-data)',
                                    color: profitRate >= 0 ? '#2DD4A8' : '#F04363',
                                }}>
                                    {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(1)}%
                                </div>
                            </div>

                            {title && (
                                <div style={{ textAlign: 'center', margin: '10px 0', padding: '6px 14px', background: 'rgba(240,180,41,0.08)', borderRadius: '16px', display: 'inline-block', width: '100%' }}>
                                    <span style={{ fontSize: '13px', color: '#E8A317' }}>👑 {title}</span>
                                </div>
                            )}

                            <div style={{ margin: '16px auto', maxWidth: '200px' }}>
                                <RadarChart scores={metrics} />
                            </div>

                            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '12px' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(229,221,208,0.4)', fontFamily: 'var(--font-data)' }}>
                                    Day {day} · {roleName} · 所有的选择都有价格
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button className="btn-outline" onClick={onClose} style={{ flex: 1, padding: '10px' }}>关闭</button>
                            <button className="btn-arcade" onClick={generatePoster} disabled={generating} style={{ flex: 2, padding: '10px' }}>
                                {generating ? '生成中...' : '📸 生成海报'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>长按图片保存分享 📤</div>
                            <img src={imageUrl} alt="分享海报" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-card)' }} />
                        </div>
                        <button className="btn-outline" onClick={onClose} style={{ width: '100%', padding: '10px' }}>关闭</button>
                    </>
                )}
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
git add frontend/src/components/SharePoster.jsx
git commit -m "feat: create SharePoster component with html2canvas screenshot"
```

---

### Task 5: Integrate SharePoster into Settlement Screen

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add share state and button**

Add import:
```js
import SharePoster from './components/SharePoster';
```

Add state:
```js
const [showSharePoster, setShowSharePoster] = useState(false);
```

In the SETTLEMENT phase JSX, add a share button (after the "返回大厅" button):
```jsx
<button className="btn-sky" onClick={() => setShowSharePoster(true)} style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }}>
    📤 生成分享海报
</button>
```

Add the poster modal (inside the SETTLEMENT block):
```jsx
{showSharePoster && (
    <SharePoster
        metrics={settlementReport.metrics}
        profitRate={((store.assets - 30000) / 30000) * 100}
        title={settlementReport.biases?.length === 0 ? '稳健投资者' : '热血操盘手'}
        roleName={ROLE_OPTIONS.find(r => r.id === store.roleType)?.name || ''}
        day={store.day}
        onClose={() => setShowSharePoster(false)}
    />
)}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: integrate share poster button into settlement screen"
```
