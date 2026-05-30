export default function PVPMonitor({ opponentList }) {
    return (
        <div className="game-card--static" style={{
            padding: '15px',
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '260px',
            zIndex: 1000,
            border: '2px solid var(--crimson)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.5), 0 0 20px rgba(232, 55, 90, 0.1)',
            /* Mobile responsive: constrain on small screens */
            maxWidth: 'min(260px, calc(100% - 40px))'
        }}>
            <h4 style={{
                margin: '0 0 10px 0',
                borderBottom: '1px solid var(--border-card)',
                paddingBottom: '5px',
                fontFamily: 'var(--font-display)',
                color: 'var(--crimson)'
            }}>⚔️ PVP 局内看板</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(opponentList).map(([uid, data]) => {
                    const progressPercent = (data.day / 15) * 100;
                    return (
                        <div key={uid} style={{ fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                                <span>{uid.startsWith('bot_') ? (
                                    <><span style={{
                                        background: 'rgba(232, 55, 90, 0.1)',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(232, 55, 90, 0.2)'
                                    }}>🤖</span>{' '}电脑玩家 <span style={{ fontFamily: 'var(--font-data)', opacity: 0.7 }}>({uid})</span></>
                                ) : (
                                    <span style={{ fontFamily: 'var(--font-data)' }}>{uid.substring(0, 8)}...</span>
                                )}</span>
                                <span style={{
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-data)',
                                    color: 'var(--amber)'
                                }}>¥{data.assets.toFixed(0)}</span>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--border-card)',
                                height: '6px',
                                borderRadius: '3px',
                                position: 'relative'
                            }}>
                                <div
                                    style={{
                                        width: `${progressPercent}%`,
                                        background: data.is_finished
                                            ? 'linear-gradient(90deg, rgba(10,207,131,0.6), var(--jade))'
                                            : 'linear-gradient(90deg, rgba(56,189,248,0.6), var(--sky))',
                                        height: '100%',
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '2px' }}>
                                {data.is_finished ? "已完赛" : `进行至 Day ${data.day}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
