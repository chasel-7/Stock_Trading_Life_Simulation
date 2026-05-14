/** 都市轻漫画风 — 统一设计系统 */
export const THEME = {
  colors: {
    bgPrimary: 0x12101f,
    bgSecondary: 0x1a1832,
    bgCard: 0x221f38,
    bgCardHover: 0x2a2745,
    accent: 0x6c5ce7,
    accentLight: 0x8577ed,
    accentGlow: 0x6c5ce7,
    gold: 0xffd700,
    textPrimary: '#eae8ff',
    textSecondary: '#9896b0',
    textMuted: '#5c5a72',
    rise: '#ff6b6b',      // A股红涨
    fall: '#51cf66',       // A股绿跌
    riseBg: 0x3d1f1f,
    fallBg: 0x1f3d2a,
    positive: 0x51cf66,
    negative: 0xff6b6b,
    border: 0x3d3a56,
    borderActive: 0x6c5ce7,
    overlay: 0x000000,
  },
  font: {
    primary: '"Noto Sans SC", "PingFang SC", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
  },
  radius: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadow: {
    card: 0x0a0918,
    cardAlpha: 0.5,
  },
} as const;

/** CSS颜色字符串版本 */
export const COLORS_CSS = {
  bgPrimary: '#12101f',
  bgSecondary: '#1a1832',
  accent: '#6c5ce7',
  gold: '#ffd700',
  rise: '#ff6b6b',
  fall: '#51cf66',
} as const;
