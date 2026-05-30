import React, { useState } from 'react';

/**
 * 分时走势图 / 日K蜡烛图 — 可切换
 * 
 * @param {number[]} prices   当天分时价格 (0~tick, 最多240点)
 * @param {Array}    history  历史日K数据 [{ day, open, close, high, low }, ...]
 */
export default function KLineChart({ prices, history }) {
    const [mode, setMode] = useState('intraday'); // 'intraday' | 'kline'

    if (!prices || prices.length === 0) return null;

    const hasHistory = history && history.length > 0;

    return (
        <div className="game-card--static" style={{ padding: '10px 10px 6px 10px' }}>
            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '8px', borderBottom: '1px solid var(--border-card)' }}>
                <button
                    onClick={() => setMode('intraday')}
                    style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: '11px',
                        fontFamily: 'var(--font-data)',
                        letterSpacing: '0.04em',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: mode === 'intraday' ? '2px solid var(--amber)' : '2px solid transparent',
                        color: mode === 'intraday' ? 'var(--amber)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    分时
                </button>
                <button
                    onClick={() => setMode('kline')}
                    style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: '11px',
                        fontFamily: 'var(--font-data)',
                        letterSpacing: '0.04em',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: mode === 'kline' ? '2px solid var(--amber)' : '2px solid transparent',
                        color: mode === 'kline' ? 'var(--amber)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        opacity: hasHistory ? 1 : 0.4,
                    }}
                    disabled={!hasHistory}
                >
                    日K
                </button>
            </div>

            {mode === 'intraday' ? (
                <IntradayChart prices={prices} />
            ) : (
                <CandlestickChart history={history || []} currentPrices={prices} />
            )}
        </div>
    );
}

/* ─── 分时走势图 ─── */
function IntradayChart({ prices }) {
    const maxVal = Math.max(...prices);
    const minVal = Math.min(...prices);
    const range = maxVal - minVal || 1;

    const LM = 0;    // left margin
    const RM = 42;   // right margin for Y-axis labels
    const W = 300, H = 68, pad = 4;
    const totalW = W + RM;

    const points = prices.map((p, i) => {
        const x = prices.length === 1 ? LM : LM + (i / 239) * W;
        const y = pad + (H - pad) - ((p - minVal) / range) * (H - pad * 2);
        return `${x},${y}`;
    }).join(' ');

    const timeLabels = [
        { tick: 0, label: '9:30' },
        { tick: 60, label: '10:30' },
        { tick: 120, label: '11:30' },
        { tick: 150, label: '13:00' },
        { tick: 210, label: '14:30' },
        { tick: 239, label: '15:00' },
    ];

    // Y轴价格标签 (最高、75%、50%、25%、最低)
    const yPriceLabels = [0, 0.25, 0.5, 0.75, 1].map(r => ({
        price: maxVal - r * range,
        y: pad + (H - pad) * r,
    }));

    const lastPrice = prices[prices.length - 1];
    const openPrice = prices[0];
    const pctChange = ((lastPrice - openPrice) / openPrice) * 100;

    return (
        <>
            <svg viewBox={`0 0 ${totalW} ${H + 12}`} style={{ width: '100%', height: '90px', display: 'block' }}>
                <defs>
                    <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#E8A317" />
                        <stop offset="100%" stopColor="#2DD4A8" />
                    </linearGradient>
                    <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(232,163,23,0.12)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {/* 横向网格 */}
                {[0.25, 0.5, 0.75].map(r => (
                    <line key={r} x1={LM} y1={pad + (H - pad) * r} x2={W} y2={pad + (H - pad) * r} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                ))}

                {/* Y轴价格标签 */}
                {yPriceLabels.map((lbl, i) => (
                    <text key={i} x={W + 4} y={lbl.y + 2.5} textAnchor="start" fill="rgba(229,221,208,0.4)" fontSize="6" fontFamily="Space Mono, monospace">
                        {lbl.price.toFixed(2)}
                    </text>
                ))}

                {/* 竖向时间线 */}
                {timeLabels.map(t => (
                    <line key={t.tick} x1={LM + (t.tick / 239) * W} y1={0} x2={LM + (t.tick / 239) * W} y2={H} stroke="rgba(255,255,255,0.04)" strokeDasharray="2 3" />
                ))}

                {/* 面积 */}
                <polygon fill="url(#af)" points={`${points} ${LM + ((prices.length - 1) / 239) * W},${H} ${LM},${H}`} />
                {/* 线 */}
                <polyline fill="none" stroke="url(#gl)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />

                {/* 当前点 */}
                {prices.length > 1 && (() => {
                    const lx = LM + ((prices.length - 1) / 239) * W;
                    const ly = pad + (H - pad) - ((lastPrice - minVal) / range) * (H - pad * 2);
                    return <circle cx={lx} cy={ly} r="2.5" fill={pctChange >= 0 ? '#2DD4A8' : '#F04363'} stroke="var(--bg-card)" strokeWidth="1.5" />;
                })()}

                {/* X轴时间 */}
                {timeLabels.map(t => (
                    <text key={t.label} x={LM + (t.tick / 239) * W} y={H + 10} textAnchor="middle" fill="rgba(229,221,208,0.35)" fontSize="6.5" fontFamily="Space Mono, monospace">
                        {t.label}
                    </text>
                ))}
            </svg>

            {/* 价格条 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span>L ¥{minVal.toFixed(2)}</span>
                <span style={{ color: pctChange >= 0 ? 'var(--jade)' : 'var(--crimson)', fontWeight: 700 }}>
                    ¥{lastPrice.toFixed(2)} ({pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%)
                </span>
                <span>H ¥{maxVal.toFixed(2)}</span>
            </div>
        </>
    );
}

/* ─── 日K蜡烛图 ─── */
function CandlestickChart({ history, currentPrices }) {
    // 把今天的实时数据也加进来作为最后一根K线
    const todayCandle = currentPrices && currentPrices.length > 1 ? {
        day: (history.length > 0 ? history[history.length - 1].day + 1 : 1),
        open: currentPrices[0],
        close: currentPrices[currentPrices.length - 1],
        high: Math.max(...currentPrices),
        low: Math.min(...currentPrices),
        isLive: true,
    } : null;

    const allCandles = [...history, ...(todayCandle ? [todayCandle] : [])];

    if (allCandles.length === 0) return <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '16px 0', textAlign: 'center' }}>暂无历史数据</div>;

    const allHigh = Math.max(...allCandles.map(d => d.high));
    const allLow = Math.min(...allCandles.map(d => d.low));
    const kRange = allHigh - allLow || 1;

    const kH = 70;
    const barW = Math.max(4, Math.min(10, 200 / allCandles.length));
    const gap = barW + Math.max(3, Math.min(8, 140 / allCandles.length));
    const chartW = Math.max(allCandles.length * gap + 10, 80);
    const RM = 42;
    const svgW = chartW + RM;

    const toY = (price) => 4 + (kH - 8) - ((price - allLow) / kRange) * (kH - 8);

    // Y轴价格标签
    const yPriceLabels = [0, 0.25, 0.5, 0.75, 1].map(r => ({
        price: allHigh - r * kRange,
        y: 4 + (kH - 8) * r,
    }));

    return (
        <>
            <svg viewBox={`0 0 ${svgW} ${kH + 12}`} style={{ width: '100%', height: '90px', display: 'block' }}>
                {/* 横向参考线 */}
                {[0.25, 0.5, 0.75].map(r => (
                    <line key={r} x1={0} y1={4 + (kH - 8) * r} x2={chartW} y2={4 + (kH - 8) * r} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                ))}

                {/* Y轴价格标签 */}
                {yPriceLabels.map((lbl, i) => (
                    <text key={i} x={chartW + 4} y={lbl.y + 2.5} textAnchor="start" fill="rgba(229,221,208,0.4)" fontSize="6" fontFamily="Space Mono, monospace">
                        {lbl.price.toFixed(2)}
                    </text>
                ))}

                {allCandles.map((d, i) => {
                    const x = i * gap + gap / 2 + 4;
                    const isUp = d.close >= d.open;
                    const bodyTop = toY(Math.max(d.open, d.close));
                    const bodyBot = toY(Math.min(d.open, d.close));
                    const bodyHeight = Math.max(bodyBot - bodyTop, 1);
                    const wickTop = toY(d.high);
                    const wickBot = toY(d.low);
                    const color = isUp ? '#2DD4A8' : '#F04363';

                    return (
                        <g key={i} opacity={d.isLive ? 0.7 : 1}>
                            {/* 上下影线 */}
                            <line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={color} strokeWidth="1" />
                            {/* 实体 */}
                            <rect
                                x={x - barW / 2}
                                y={bodyTop}
                                width={barW}
                                height={bodyHeight}
                                fill={isUp ? 'transparent' : color}
                                stroke={color}
                                strokeWidth="1"
                                rx="0.5"
                            />
                            {/* 实时标记 */}
                            {d.isLive && (
                                <circle cx={x} cy={toY(d.close)} r="1.5" fill={color}>
                                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                                </circle>
                            )}
                            {/* 日期标签 */}
                            <text x={x} y={kH + 10} textAnchor="middle" fill="rgba(229,221,208,0.3)" fontSize="5.5" fontFamily="Space Mono, monospace">
                                {d.isLive ? '今' : `D${d.day}`}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* 价格范围 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span>区间低 ¥{allLow.toFixed(2)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{allCandles.length}日</span>
                <span>区间高 ¥{allHigh.toFixed(2)}</span>
            </div>
        </>
    );
}
