import React, { useState, useEffect, useCallback } from 'react';

/**
 * GameToast — 游戏风格的弹窗通知组件
 * 
 * 用法:
 *   const toast = useToast();
 *   toast.show("消息内容", "success");  // success | error | warning | info
 *   
 *   <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
 */

/* ─── Toast Hook ─── */
let _toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'info', duration = 3500) => {
        const id = ++_toastId;
        setToasts(prev => [...prev, { id, message, type, createdAt: Date.now() }]);
        
        // 自动消失
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
        
        return id;
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, show, dismiss };
}

/* ─── Toast 配置 ─── */
const TOAST_CONFIG = {
    success: {
        icon: '✅',
        borderColor: 'var(--jade)',
        bgColor: 'rgba(45, 212, 168, 0.08)',
        glowColor: 'rgba(45, 212, 168, 0.15)',
        textColor: 'var(--jade)',
    },
    error: {
        icon: '💀',
        borderColor: 'var(--crimson)',
        bgColor: 'rgba(240, 67, 99, 0.08)',
        glowColor: 'rgba(240, 67, 99, 0.15)',
        textColor: 'var(--crimson)',
    },
    warning: {
        icon: '⚠️',
        borderColor: 'var(--amber)',
        bgColor: 'rgba(232, 163, 23, 0.08)',
        glowColor: 'rgba(232, 163, 23, 0.15)',
        textColor: 'var(--amber)',
    },
    info: {
        icon: '💬',
        borderColor: 'var(--sky)',
        bgColor: 'rgba(91, 192, 248, 0.08)',
        glowColor: 'rgba(91, 192, 248, 0.15)',
        textColor: 'var(--sky)',
    },
};

/* ─── Toast Item ─── */
function ToastItem({ toast, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false);
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 280);
    };

    // 自动退出动画
    useEffect(() => {
        const elapsed = Date.now() - toast.createdAt;
        const remaining = Math.max(0, 3200 - elapsed);
        const timer = setTimeout(() => setIsExiting(true), remaining);
        return () => clearTimeout(timer);
    }, [toast.createdAt]);

    return (
        <div
            onClick={handleDismiss}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                background: config.bgColor,
                border: `2px solid ${config.borderColor}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: `4px 4px 0px rgba(0,0,0,0.4), 0 0 24px ${config.glowColor}`,
                cursor: 'pointer',
                maxWidth: '420px',
                width: '92vw',
                backdropFilter: 'blur(12px)',
                animation: isExiting 
                    ? 'toastSlideOut 0.28s ease forwards' 
                    : 'toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* 左侧进度条 */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: config.borderColor,
                animation: 'toastProgress 3.5s linear forwards',
                borderRadius: '0 0 0 var(--radius-md)',
            }} />

            <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1 }}>{config.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    wordBreak: 'break-word',
                }}>
                    {toast.message}
                </div>
            </div>
            <span style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                flexShrink: 0,
                lineHeight: 1,
                marginTop: '2px',
            }}>✕</span>
        </div>
    );
}

/* ─── Toast Container (固定在顶部) ─── */
export function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
            pointerEvents: 'none',
        }}>
            {toasts.map(toast => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <ToastItem toast={toast} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}
