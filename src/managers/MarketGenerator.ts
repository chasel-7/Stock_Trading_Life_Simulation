import type { MarketDataPack } from './StockManager';
import type { DailyStockData } from '../models/types';
import { Sector } from '../config/constants';
import { SECTOR_PROFILES, type SectorProfile } from '../data/sectorProfiles';
import { GAME_CONSTANTS } from '../config/constants';
import stockPoolData from '../data/stockPool.json';

interface PoolStock {
  id: string;
  sector: string;
  keywords: string[];
}

const SECTOR_MAP: Record<string, Sector> = {
  '消费': Sector.CONSUMER,
  '科技': Sector.TECH,
  '制造': Sector.MANUFACTURING,
  '医药': Sector.PHARMA,
  '金融': Sector.FINANCE,
};

export class MarketGenerator {
  /**
   * 从100支股票池中抽取15支并生成随机行情
   * 规则：每板块3支，其中2-3支标记为推荐股
   */
  static generate(totalDays: number = GAME_CONSTANTS.TOTAL_DAYS): MarketDataPack {
    const pool = stockPoolData.stocks as PoolStock[];
    const selected = MarketGenerator.selectStocks(pool);
    const recommended = MarketGenerator.markRecommended(selected);

    const stocks = selected.map(s => {
      const profile = SECTOR_PROFILES[s.sector];
      const basePrice = MarketGenerator.randomInRange(profile.priceRange[0], profile.priceRange[1]);
      const trend = (Math.random() - 0.5) * 2 * profile.trendRange;
      const dailyData = MarketGenerator.generateDailyData(basePrice, trend, profile, totalDays);

      return {
        id: s.id,
        sector: SECTOR_MAP[s.sector] || Sector.CONSUMER,
        keywords: s.keywords,
        isRecommended: recommended.has(s.id),
        dailyData,
      };
    });

    return { totalDays, stocks };
  }

  /** 每板块随机抽3支 */
  private static selectStocks(pool: PoolStock[]): PoolStock[] {
    const bySector: Record<string, PoolStock[]> = {};
    for (const s of pool) {
      if (!bySector[s.sector]) bySector[s.sector] = [];
      bySector[s.sector].push(s);
    }

    const selected: PoolStock[] = [];
    for (const sector of Object.keys(bySector)) {
      const candidates = [...bySector[sector]];
      MarketGenerator.shuffle(candidates);
      selected.push(...candidates.slice(0, GAME_CONSTANTS.STOCKS_PER_SECTOR));
    }
    return selected;
  }

  /** 标记2-3支推荐股 */
  private static markRecommended(stocks: PoolStock[]): Set<string> {
    const count = GAME_CONSTANTS.RECOMMENDED_COUNT;
    const shuffled = [...stocks];
    MarketGenerator.shuffle(shuffled);
    return new Set(shuffled.slice(0, count).map(s => s.id));
  }

  /** 生成一支股票的全部天数据 */
  private static generateDailyData(
    basePrice: number, trend: number, profile: SectorProfile, totalDays: number,
  ): DailyStockData[] {
    const result: DailyStockData[] = [];
    let prevClose = basePrice;

    for (let day = 0; day < totalDays; day++) {
      let dailyReturn = trend + (Math.random() - 0.5) * profile.dailyVol * 2;

      // 突发事件
      if (Math.random() < profile.eventChance) {
        dailyReturn += (Math.random() > 0.5 ? 1 : -1) * profile.eventImpact;
      }

      const open = Math.round(prevClose * (1 + (Math.random() - 0.5) * 0.01) * 100) / 100;
      const close = Math.round(prevClose * (1 + dailyReturn) * 100) / 100;
      const high = Math.round(Math.max(open, close) * (1 + Math.random() * profile.dailyVol) * 100) / 100;
      const low = Math.round(Math.min(open, close) * (1 - Math.random() * profile.dailyVol) * 100) / 100;
      const ticks = MarketGenerator.generateTicks(open, close, high, low, GAME_CONSTANTS.PRICE_TOTAL_TICKS);

      result.push({ open, close, high, low, ticks });
      prevClose = close;
    }
    return result;
  }

  /** 生成盘中tick序列 */
  private static generateTicks(
    open: number, close: number, high: number, low: number, count: number,
  ): number[] {
    const ticks: number[] = [open];
    const range = high - low;

    for (let i = 1; i < count - 1; i++) {
      const progress = i / (count - 1);
      const base = open + (close - open) * progress;
      const noise = (Math.random() - 0.5) * range * 0.3;
      const price = Math.max(low, Math.min(high, base + noise));
      ticks.push(Math.round(price * 100) / 100);
    }
    ticks.push(close);
    return ticks;
  }

  private static shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private static randomInRange(min: number, max: number): number {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
  }

  /** 从预生成数据包目录随机加载一组行情 */
  static async loadRandomPack(): Promise<MarketDataPack | null> {
    try {
      const indexResp = await fetch('/data/marketPacks/index.json');
      if (!indexResp.ok) return null;
      const index = await indexResp.json() as { packs: string[] };
      if (!index.packs || index.packs.length === 0) return null;

      const randomPack = index.packs[Math.floor(Math.random() * index.packs.length)];
      const packResp = await fetch(`/data/marketPacks/${randomPack}`);
      if (!packResp.ok) return null;
      return await packResp.json() as MarketDataPack;
    } catch {
      return null;
    }
  }

  /** 智能选择：优先加载真实数据包，失败时降级为随机生成 */
  static async generateOrLoad(totalDays?: number): Promise<MarketDataPack> {
    const pack = await MarketGenerator.loadRandomPack();
    if (pack) return pack;
    return MarketGenerator.generate(totalDays);
  }
}
