import type { StockInfo, DailyStockData } from '../models/types';

/** 行情数据包（由 generateMarketData 脚本生成的 JSON 格式） */
export interface MarketDataPack {
  totalDays: number;
  stocks: StockInfo[];
}

export class StockManager {
  private stocks: Map<string, StockInfo> = new Map();
  private totalDays: number;

  constructor(data: MarketDataPack) {
    this.totalDays = data.totalDays;
    for (const stock of data.stocks) {
      this.stocks.set(stock.id, stock);
    }
  }

  /** 获取所有股票ID */
  getStockIds(): string[] {
    return Array.from(this.stocks.keys());
  }

  /** 获取股票信息 */
  getStock(id: string): StockInfo | undefined {
    return this.stocks.get(id);
  }

  /** 获取总天数 */
  getTotalDays(): number {
    return this.totalDays;
  }

  /** 获取某日行情 */
  getDailyData(stockId: string, day: number): DailyStockData {
    const stock = this.stocks.get(stockId);
    if (!stock) throw new Error(`Stock ${stockId} not found`);
    if (day < 0 || day >= stock.dailyData.length) {
      throw new Error(`Day ${day} out of range for stock ${stockId}`);
    }
    return stock.dailyData[day];
  }

  /** 获取收盘价 */
  getClosePrice(stockId: string, day: number): number {
    return this.getDailyData(stockId, day).close;
  }

  /** 获取某日某tick的价格 */
  getTickPrice(stockId: string, day: number, tickIndex: number): number {
    const daily = this.getDailyData(stockId, day);
    if (tickIndex < 0 || tickIndex >= daily.ticks.length) {
      throw new Error(`Tick ${tickIndex} out of range`);
    }
    return daily.ticks[tickIndex];
  }

  /** 获取推荐股列表 */
  getRecommendedStocks(): StockInfo[] {
    return Array.from(this.stocks.values()).filter(s => s.isRecommended);
  }

  /** 判断某支股票是否是推荐股 */
  isRecommended(stockId: string): boolean {
    const stock = this.stocks.get(stockId);
    return stock ? stock.isRecommended : false;
  }
}
