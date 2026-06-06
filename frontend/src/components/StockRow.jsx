import { useState } from 'react';

export default function StockRow({ stockName, price, holdingQty, onTrade }) {
    const [tradeQty, setTradeQty] = useState(100);

    return (
        <div className="game-card--static trade-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', margin: '8px 0' }}>
            <div>
                <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-display)', fontSize: '15px' }}>{stockName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>持有: {holdingQty} 股</div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--amber)', fontFamily: 'var(--font-data)' }}>
                ¥{price.toFixed(2)}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                    type="number"
                    className="input-game"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(parseInt(e.target.value) || 0)}
                    style={{ width: '65px', textAlign: 'center', padding: '6px' }}
                />
                <button className="btn-jade" onClick={() => onTrade('BUY', tradeQty)}>📈 买入</button>
                <button className="btn-danger" onClick={() => onTrade('SELL', tradeQty)}>📉 卖出</button>
            </div>
        </div>
    );
}
