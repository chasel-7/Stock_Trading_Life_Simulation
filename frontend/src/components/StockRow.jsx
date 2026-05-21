import React, { useState } from 'react';

export default function StockRow({ stockName, price, holdingQty, onTrade }) {
    const [tradeQty, setTradeQty] = useState(100);

    return (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', margin: '8px 0' }}>
            <div>
                <div style={{ fontWeight: 'bold' }}>{stockName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>持有: {holdingQty} 股</div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-green)' }}>
                ¥{price.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="number"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(parseInt(e.target.value) || 0)}
                    style={{ width: '60px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', textAlign: 'center' }}
                />
                <button className="neon-btn-green" onClick={() => onTrade('BUY', tradeQty)}>买入</button>
                <button className="neon-btn-green" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }} onClick={() => onTrade('SELL', tradeQty)}>卖出</button>
            </div>
        </div>
    );
}
