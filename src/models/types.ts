import type { Sector, MoodLevel } from '../config/constants';

/** 单支股票的日行情数据 */
export interface DailyStockData {
  open: number;
  close: number;
  high: number;
  low: number;
  /** 盘中步进价格序列 */
  ticks: number[];
}

/** 股票定义 */
export interface StockInfo {
  id: string;           // e.g. "科技-07"
  sector: Sector;
  keywords: string[];   // 关键词提示
  isRecommended: boolean;
  /** 按天索引的行情数据 */
  dailyData: DailyStockData[];
}

/** 玩家持仓 */
export interface Holding {
  stockId: string;
  shares: number;       // 持有份数（简化为金额单位）
  costBasis: number;    // 买入成本总额
}

/** 角色配置 */
export interface CharacterConfig {
  id: string;
  name: string;
  startingCash: number;
  dailySalary: number | [number, number]; // 固定值或[min,max]随机
  dailyLivingCost: number;
  eventFrequency: number;  // 每天平均事件次数
  specialAbility: string;
  commissionRate: number;
}

/** 游戏存档状态 */
export interface GameState {
  currentDay: number;
  totalDays: number;
  cash: number;
  holdings: Holding[];
  startingCash: number;
  characterId: string;
  /** 当日阶段: 盘前/盘中/盘后/结算 */
  phase: 'pre-market' | 'trading' | 'post-market' | 'settlement';
  /** 每日资产快照（用于复盘） */
  dailySnapshots: DailySnapshot[];
  /** 已获取的信息 */
  collectedInfo: InfoItem[];
  /** 手续费减半剩余天数 */
  commissionDiscountDays: number;
  gameOver: boolean;
  gameResult: 'playing' | 'bankrupt' | 'win' | 'timeout';
}

export interface DailySnapshot {
  day: number;
  cash: number;
  holdingsValue: number;
  totalAssets: number;
  dailyReturn: number;  // 当日收益率
  mood: MoodLevel;
}

export interface InfoItem {
  stockId: string;
  source: string;
  content: string;
  accuracy: number;     // 0~1
  day: number;
}
