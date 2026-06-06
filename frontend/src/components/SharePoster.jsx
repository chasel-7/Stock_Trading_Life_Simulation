import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import RadarChart from './RadarChart';

export default function SharePoster({ metrics, profitRate, title, roleName, day, onClose }) {
    const posterRef = useRef(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [generating, setGenerating] = useState(false);

    const generatePoster = async () => {
        if (!posterRef.current) return;
        setGenerating(true);
        try {
            const canvas = await html2canvas(posterRef.current, {
                backgroundColor: '#0D0F14',
                scale: 2,
                useCORS: true,
            });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);
        } catch (err) {
            console.error('Failed to generate poster:', err);
        }
        setGenerating(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '20px', maxWidth: '380px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                {!imageUrl ? (
                    <>
                        {/* 海报内容 (用于截图) */}
                        <div ref={posterRef} style={{ padding: '24px', background: '#0D0F14', borderRadius: '12px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🕹️</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#E8A317' }}>股票人生模拟器</div>
                                <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(229,221,208,0.4)', letterSpacing: '0.15em' }}>STOCK LIFE ARCADE</div>
                            </div>

                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(229,221,208,0.5)', marginBottom: '4px' }}>最终收益率</div>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-data)',
                                    color: profitRate >= 0 ? '#2DD4A8' : '#F04363',
                                }}>
                                    {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(1)}%
                                </div>
                            </div>

                            {title && (
                                <div style={{ textAlign: 'center', margin: '10px 0', padding: '6px 14px', background: 'rgba(240,180,41,0.08)', borderRadius: '16px', display: 'inline-block', width: '100%' }}>
                                    <span style={{ fontSize: '13px', color: '#E8A317' }}>👑 {title}</span>
                                </div>
                            )}

                            <div style={{ margin: '16px auto', maxWidth: '200px' }}>
                                <RadarChart scores={metrics} />
                            </div>

                            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '12px' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(229,221,208,0.4)', fontFamily: 'var(--font-data)' }}>
                                    Day {day} · {roleName} · 所有的选择都有价格
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                            <button className="btn-outline" onClick={onClose} style={{ flex: 1, padding: '10px' }}>关闭</button>
                            <button className="btn-arcade" onClick={generatePoster} disabled={generating} style={{ flex: 2, padding: '10px' }}>
                                {generating ? '生成中...' : '📸 生成海报'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>长按图片保存分享 📤</div>
                            <img src={imageUrl} alt="分享海报" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-card)' }} />
                        </div>
                        <button className="btn-outline" onClick={onClose} style={{ width: '100%', padding: '10px' }}>关闭</button>
                    </>
                )}
            </div>
        </div>
    );
}
