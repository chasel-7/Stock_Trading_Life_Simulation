import React from 'react';

export default function DecisionCard({ sceneName, cost, description, onConfirm }) {
    return (
        <div className="game-card" style={{ padding: '20px', maxWidth: '420px', margin: '20px auto', textAlign: 'center', animation: 'cardDrop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <h4 style={{ color: 'var(--amber)', margin: '0 0 10px 0', fontFamily: 'var(--font-display)', fontSize: '18px' }}>🌃 盘后场景事件: {sceneName}</h4>
            <div className="speech-bubble">
                <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'left' }}>{description}</p>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '15px 0' }}>
                💰 预计花费: <span style={{ color: 'var(--crimson)', fontWeight: 'bold', fontFamily: 'var(--font-data)' }}>¥{cost}</span>
            </div>
            <button className="btn-arcade" onClick={onConfirm} style={{ width: '100%', padding: '10px' }}>
                ✨ 确认选择并继续
            </button>
        </div>
    );
}
