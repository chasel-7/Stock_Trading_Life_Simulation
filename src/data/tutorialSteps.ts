export interface TutorialStep {
  id: string;
  day: number;           // 在哪天触发
  phase: 'pre-market' | 'trading' | 'post-market' | 'settlement';
  npcName: string;
  npcEmoji: string;
  message: string;
  /** 高亮区域（可选） */
  highlightArea?: { x: number; y: number; w: number; h: number };
  /** 需要用户完成的操作才能继续 */
  waitForAction?: 'buy' | 'sell' | 'choose-scene' | 'next-phase' | 'none';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // === Day 1: 认识交易界面 ===
  {
    id: 'welcome',
    day: 1, phase: 'pre-market',
    npcName: '老张', npcEmoji: '👴',
    message: '欢迎来到股市！我是你的同事老张，今天教你看盘。先看看今天的大盘趋势和推荐股吧。',
    waitForAction: 'next-phase',
  },
  {
    id: 'trading-intro',
    day: 1, phase: 'trading',
    npcName: '老张', npcEmoji: '👴',
    message: '这是盘中交易界面。上面是自选股列表，点击可以看K线图。试试买入一支股票吧！',
    highlightArea: { x: 0, y: 60, w: 390, h: 300 },
    waitForAction: 'buy',
  },
  {
    id: 'after-buy',
    day: 1, phase: 'trading',
    npcName: '老张', npcEmoji: '👴',
    message: '不错！你可以选择全仓、半仓或1/4仓。仓位管理很重要，别把鸡蛋放一个篮子里。',
    waitForAction: 'next-phase',
  },
  {
    id: 'settlement-intro',
    day: 1, phase: 'settlement',
    npcName: '老张', npcEmoji: '👴',
    message: '每天结束后会扣除生活费和手续费，然后显示今天的盈亏。明天我再教你别的。',
    waitForAction: 'none',
  },
  // === Day 2: 场景选择与信息系统 ===
  {
    id: 'day2-premarket',
    day: 2, phase: 'pre-market',
    npcName: '老张', npcEmoji: '👴',
    message: '第二天了！注意看你的心情状态，它会影响你能去哪些盘后场景。',
    waitForAction: 'next-phase',
  },
  {
    id: 'post-market-intro',
    day: 2, phase: 'post-market',
    npcName: '老张', npcEmoji: '👴',
    message: '收盘后可以选择去不同场景社交。花钱的场景能获取更多信息。试试去大排档吧！',
    highlightArea: { x: 0, y: 200, w: 390, h: 400 },
    waitForAction: 'choose-scene',
  },
  {
    id: 'info-intro',
    day: 2, phase: 'post-market',
    npcName: '老张', npcEmoji: '👴',
    message: '你获得了一条信息！如果从不同来源获得关于同一支股票的信息，准确率会大幅提升。从第3天开始，你就要靠自己了。加油！',
    waitForAction: 'none',
  },
];
