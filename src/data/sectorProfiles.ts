export interface SectorProfile {
  sector: string;
  /** 日均波动率（标准差） */
  dailyVol: number;
  /** 趋势强度范围 [-max, +max]，随机取值 */
  trendRange: number;
  /** 价格范围 [min, max] — 模糊化后的价格区间 */
  priceRange: [number, number];
  /** 突发事件概率（每天） */
  eventChance: number;
  /** 事件影响幅度 */
  eventImpact: number;
  /** 设计描述 */
  description: string;
}

export const SECTOR_PROFILES: Record<string, SectorProfile> = {
  '消费': {
    sector: '消费',
    dailyVol: 0.025,
    trendRange: 0.004,
    priceRange: [10, 50],
    eventChance: 0.1,
    eventImpact: 0.03,
    description: '稳健偏多，偶有爆发',
  },
  '科技': {
    sector: '科技',
    dailyVol: 0.055,
    trendRange: 0.01,
    priceRange: [8, 45],
    eventChance: 0.2,
    eventImpact: 0.06,
    description: '波动大，涨跌幅极端',
  },
  '制造': {
    sector: '制造',
    dailyVol: 0.035,
    trendRange: 0.006,
    priceRange: [15, 80],
    eventChance: 0.1,
    eventImpact: 0.04,
    description: '趋势性强，慢涨慢跌',
  },
  '医药': {
    sector: '医药',
    dailyVol: 0.04,
    trendRange: 0.005,
    priceRange: [12, 60],
    eventChance: 0.25,
    eventImpact: 0.05,
    description: '受事件驱动明显',
  },
  '金融': {
    sector: '金融',
    dailyVol: 0.015,
    trendRange: 0.003,
    priceRange: [5, 35],
    eventChance: 0.05,
    eventImpact: 0.02,
    description: '波动小，随大盘走',
  },
};
