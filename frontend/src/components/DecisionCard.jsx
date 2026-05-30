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
                        className={opt.cost > 0 ? "btn-outline" : (oi === 0 ? "btn-jade" : "btn-outline")}
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
