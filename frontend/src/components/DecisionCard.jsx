import React from 'react';

export default function DecisionCard({ sceneName, cost, description, onConfirm }) {
    return (
        <div className="glass-card" style={{ padding: '20px', maxWidth: '400px', margin: '20px auto', textAlign: 'center' }}>
            <h4 style={{ color: 'var(--neon-green)', margin: '0 0 10px 0' }}>🌃 盘后场景事件: {sceneName}</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{description}</p>
            <div style={{ fontSize: '13px', color: 'var(--text-gray)', margin: '15px 0' }}>
                预计花费: <span style={{ color: 'var(--neon-red)', fontWeight: 'bold' }}>¥{cost}</span>
            </div>
            <button className="neon-btn-green" onClick={onConfirm} style={{ width: '100%', padding: '10px' }}>
                确认选择并继续
            </button>
        </div>
    );
}
