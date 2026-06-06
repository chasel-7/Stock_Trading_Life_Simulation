import { useState, useEffect, useCallback } from 'react';

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
        const rafId = requestAnimationFrame(() => {
            updateTargetRect();
        });
        window.addEventListener('resize', updateTargetRect);
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', updateTargetRect);
        };
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
