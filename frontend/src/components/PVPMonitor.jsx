import React from 'react';

export default function PVPMonitor({ opponentList }) {
    return (
        <div className="glass-card" style={{ padding: '15px', position: 'fixed', bottom: '20px', right: '20px', width: '260px', zIndex: 1000 }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>📡 PVP 局内看板</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(opponentList).map(([uid, data]) => {
                    const progressPercent = (data.day / 15) * 100;
                    return (
                        <div key={uid} style={{ fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span>{uid.startsWith('bot_') ? `🤖 电脑玩家 (${uid})` : `${uid.substring(0, 8)}...`}</span>
                                <span style={{ fontWeight: 'bold' }}>¥{data.assets.toFixed(0)}</span>
                            </div>
                            <div style={{ background: '#333', height: '6px', borderRadius: '3px', position: 'relative' }}>
                                <div
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: data.is_finished ? 'var(--neon-green)' : '#00b0ff',
                                        height: '100%',
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-gray)', textAlign: 'right', marginTop: '2px' }}>
                                {data.is_finished ? "已完赛" : `进行至 Day ${data.day}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
