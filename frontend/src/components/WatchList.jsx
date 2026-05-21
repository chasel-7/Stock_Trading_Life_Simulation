import React from 'react';

const SECTOR_EMOJIS = {
    "消费": "🛒",
    "科技": "💻",
    "制造": "🏭",
    "医药": "💊",
    "金融": "💰"
};

export default function WatchList({ stocks, prices, bounds, tick, holdings, selectedStock, onSelectStock }) {
    return (
        <div className="glass-card" style={{ padding: '15px', height: '100%', boxSizing: 'border-box' }}>
            <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #333', paddingBottom: '6px' }}>📊 15支选定自选行情大盘</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-gray)', borderBottom: '1px solid #222' }}>
                            <th style={{ padding: '6px 4px' }}>股票代码</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right' }}>现价</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right' }}>日内涨跌</th>
                            <th style={{ padding: '6px 4px', textAlign: 'right' }}>持仓</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map((stock) => {
                            const sector = stock.split('-')[0];
                            const emoji = SECTOR_EMOJIS[sector] || "📈";
                            const curPrice = prices[stock]?.[tick] || bounds[stock]?.open || 10.0;
                            const openPrice = bounds[stock]?.open || 10.0;
                            const changePct = ((curPrice - openPrice) / openPrice) * 100;
                            const holdingQty = holdings[stock] || 0;
                            const isSelected = selectedStock === stock;

                            return (
                                <tr
                                    key={stock}
                                    onClick={() => onSelectStock(stock)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                                        borderBottom: '1px solid #1a1a24',
                                        transition: 'background 0.2s',
                                        borderLeft: isSelected ? '3px solid var(--neon-green)' : '3px solid transparent'
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <td style={{ padding: '8px 4px', fontWeight: '500' }}>
                                        {emoji} {stock}
                                    </td>
                                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                                        ¥{curPrice.toFixed(2)}
                                    </td>
                                    <td style={{
                                        padding: '8px 4px',
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                        color: changePct >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'
                                    }}>
                                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '8px 4px', textAlign: 'right', color: holdingQty > 0 ? 'var(--neon-green)' : 'var(--text-gray)' }}>
                                        {holdingQty > 0 ? holdingQty : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
