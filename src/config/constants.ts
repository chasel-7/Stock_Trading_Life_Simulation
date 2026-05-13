/** 游戏核心常量 */
export const GAME_CONSTANTS = {
  /** 每局交易天数 */
  TOTAL_DAYS: 15,
  /** 每局股票数量 */
  STOCKS_PER_GAME: 15,
  /** 每板块抽取数量 */
  STOCKS_PER_SECTOR: 3,
  /** 推荐股数量 */
  RECOMMENDED_COUNT: 3,
  /** 交易手续费率 */
  COMMISSION_RATE: 0.01,
  /** 书店减半后手续费率 */
  COMMISSION_RATE_HALF: 0.005,
  /** 胜利目标倍数 */
  WIN_MULTIPLIER: 2.0,
  /** 盘中价格刷新间隔(ms) */
  PRICE_TICK_INTERVAL: 7000,
  /** 盘中总步数 */
  PRICE_TOTAL_TICKS: 40,
} as const;

/** 板块定义 */
export enum Sector {
  CONSUMER = '消费',
  TECH = '科技',
  MANUFACTURING = '制造',
  PHARMA = '医药',
  FINANCE = '金融',
}

/** 仓位选项 */
export enum PositionSize {
  FULL = 1.0,
  HALF = 0.5,
  QUARTER = 0.25,
}

/** 心情档位 */
export enum MoodLevel {
  DEVASTATED = 'DEVASTATED',   // < -8%
  SAD = 'SAD',                 // -8% ~ -2%
  NEUTRAL = 'NEUTRAL',         // -2% ~ +2%
  HAPPY = 'HAPPY',             // +2% ~ +8%
  EUPHORIC = 'EUPHORIC',       // > +8%
}
