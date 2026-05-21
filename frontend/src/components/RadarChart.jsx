import React, { useState, useEffect } from 'react';

/**
 * 动态四维评估雷达图组件 (Neon Theme)
 * @param {Object} scores - { "投资智慧": val, "心态稳定": val, "社交回报": val, "生活平衡": val }
 */
export default function RadarChart({ scores }) {
    const [animatedScores, setAnimatedScores] = useState({
        "投资智慧": 0,
        "心态稳定": 0,
        "社交回报": 0,
        "生活平衡": 0
    });

    useEffect(() => {
        let start = null;
        const duration = 800; // 800ms
        
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            // 缓动函数: easeOutCubic
            const ease = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedScores({
                "投资智慧": Math.floor((scores["投资智慧"] || 0) * ease),
                "心态稳定": Math.floor((scores["心态稳定"] || 0) * ease),
                "社交回报": Math.floor((scores["社交回报"] || 0) * ease),
                "生活平衡": Math.floor((scores["生活平衡"] || 0) * ease)
            });

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        const animationFrame = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrame);
    }, [scores]);

    const cx = 150;
    const cy = 150;
    const r = 90; // 最大半径

    // 计算四个轴向点的坐标
    // 0: 顶部 - 投资智慧
    // 1: 右侧 - 社交回报
    // 2: 底部 - 生活平衡
    // 3: 左侧 - 心态稳定
    const getPoint = (index, value) => {
        const factor = value / 100;
        if (index === 0) return { x: cx, y: cy - r * factor };
        if (index === 1) return { x: cx + r * factor, y: cy };
        if (index === 2) return { x: cx, y: cy + r * factor };
        if (index === 3) return { x: cx - r * factor, y: cy };
        return { x: cx, y: cy };
    };

    const p0 = getPoint(0, animatedScores["投资智慧"]);
    const p1 = getPoint(1, animatedScores["社交回报"]);
    const p2 = getPoint(2, animatedScores["生活平衡"]);
    const p3 = getPoint(3, animatedScores["心态稳定"]);

    const polygonPoints = `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

    // 绘制背景多边形圈圈 (20%, 40%, 60%, 80%, 100%)
    const gridScales = [0.2, 0.4, 0.6, 0.8, 1.0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0' }}>
            <svg width="300" height="300" style={{ background: 'transparent' }}>
                {/* 渐变填充定义 */}
                <defs>
                    <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0, 230, 118, 0.15)" />
                        <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
                    </radialGradient>
                </defs>

                {/* 背景发光圈 */}
                <circle cx={cx} cy={cy} r={r} fill="url(#radar-glow)" />

                {/* 绘制背景蛛网多边形网格 */}
                {gridScales.map((scale, i) => {
                    const radius = r * scale;
                    const points = `${cx},${cy - radius} ${cx + radius},${cy} ${cx},${cy + radius} ${cx - radius},${cy}`;
                    return (
                        <polygon
                            key={i}
                            points={points}
                            fill="none"
                            stroke="#333"
                            strokeWidth="1"
                            strokeDasharray={i === 4 ? "none" : "2 2"}
                        />
                    );
                })}

                {/* 轴线 */}
                <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#222" strokeWidth="1" />
                <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#222" strokeWidth="1" />

                {/* 填充后的雷达指标区域 */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(0, 230, 118, 0.25)"
                    stroke="var(--neon-green)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.1s ease-out' }}
                />

                {/* 顶点标记圆点 */}
                <circle cx={p0.x} cy={p0.y} r="3" fill="#fff" stroke="var(--neon-green)" strokeWidth="1" />
                <circle cx={p1.x} cy={p1.y} r="3" fill="#fff" stroke="var(--neon-green)" strokeWidth="1" />
                <circle cx={p2.x} cy={p2.y} r="3" fill="#fff" stroke="var(--neon-green)" strokeWidth="1" />
                <circle cx={p3.x} cy={p3.y} r="3" fill="#fff" stroke="var(--neon-green)" strokeWidth="1" />

                {/* 指标文本数值标注 */}
                <text x={cx} y={cy - r - 8} textAnchor="middle" fill="var(--neon-green)" fontSize="11" fontWeight="bold">
                    投资智慧 ({scores["投资智慧"]})
                </text>
                <text x={cx + r + 8} y={cy + 4} textAnchor="start" fill="#eee" fontSize="11">
                    社交回报 ({scores["社交回报"]})
                </text>
                <text x={cx} y={cy + r + 15} textAnchor="middle" fill="#eee" fontSize="11">
                    生活平衡 ({scores["生活平衡"]})
                </text>
                <text x={cx - r - 8} y={cy + 4} textAnchor="end" fill="#eee" fontSize="11">
                    心态稳定 ({scores["心态稳定"]})
                </text>
            </svg>
        </div>
    );
}
