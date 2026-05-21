import React from 'react';

export default function KLineChart({ prices }) {
    if (!prices || prices.length === 0) return null;
    
    const maxVal = Math.max(...prices);
    const minVal = Math.min(...prices);
    const range = maxVal - minVal || 1;
    
    // 将价格映射为 SVG 的坐标点
    const points = prices.map((p, index) => {
        const x = prices.length === 1 ? 150 : (index / (prices.length - 1)) * 300;
        const y = 80 - ((p - minVal) / range) * 70; // 留白 10 像素
        return `${x},${y}`;
    }).join(' ');


    return (
        <div className="glass-card" style={{ padding: '10px', height: '100px' }}>
            <svg viewBox="0 0 300 80" style={{ width: '100%', height: '100%' }}>
                <polyline
                    fill="none"
                    stroke="url(#gradient-line)"
                    strokeWidth="2.5"
                    points={points}
                />
                <defs>
                    <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#29b6f6" />
                        <stop offset="100%" stopColor="#00e676" />
                    </linearGradient>
                </defs>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-gray)' }}>
                <span>最低: ¥{minVal.toFixed(2)}</span>
                <span>最高: ¥{maxVal.toFixed(2)}</span>
            </div>
        </div>
    );
}
