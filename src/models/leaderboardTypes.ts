export type LeaderboardCategory = 'total-return' | 'invest-wisdom' | 'social-roi' | 'overall';

export interface LeaderboardEntry {
  id: string;              // 唯一ID (timestamp-based)
  playerName: string;      // 角色名
  characterId: string;
  characterEmoji: string;
  totalReturn: number;     // 总收益率
  investWisdom: number;    // 投资智慧评分
  socialROI: number;       // 社交投资回报率
  overallScore: number;    // 四维总分
  title: string;           // 获得的称号
  timestamp: number;       // 提交时间
}

export interface LeaderboardConfig {
  category: LeaderboardCategory;
  name: string;
  emoji: string;
  sortField: keyof LeaderboardEntry;
}

export const LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  { category: 'total-return', name: '总收益榜', emoji: '💰', sortField: 'totalReturn' },
  { category: 'invest-wisdom', name: '智慧榜', emoji: '🧠', sortField: 'investWisdom' },
  { category: 'social-roi', name: '社交达人榜', emoji: '🤝', sortField: 'socialROI' },
  { category: 'overall', name: '全能榜', emoji: '🏅', sortField: 'overallScore' },
];
