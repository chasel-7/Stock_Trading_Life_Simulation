export interface TradeRecord {
  day: number;
  tickIndex: number;
  stockId: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  /** 该股票近3次tick的价格趋势 */
  recentTrend: 'up' | 'down' | 'flat';
  /** 该笔交易的盈亏（卖出时计算） */
  pnl?: number;
}

export class TradeLogger {
  private records: TradeRecord[] = [];

  log(record: TradeRecord): void {
    this.records.push(record);
  }

  getAll(): TradeRecord[] {
    return [...this.records];
  }

  getByStock(stockId: string): TradeRecord[] {
    return this.records.filter(r => r.stockId === stockId);
  }

  getByDay(day: number): TradeRecord[] {
    return this.records.filter(r => r.day === day);
  }

  /** 总交易次数 */
  totalTrades(): number {
    return this.records.length;
  }

  /** 日均交易次数 */
  avgTradesPerDay(totalDays: number): number {
    return totalDays > 0 ? this.records.length / totalDays : 0;
  }

  /** 买入次数 in 连涨后 */
  buysAfterRise(): number {
    return this.records.filter(r => r.type === 'buy' && r.recentTrend === 'up').length;
  }

  /** 卖出次数 in 连跌后 */
  sellsAfterDrop(): number {
    return this.records.filter(r => r.type === 'sell' && r.recentTrend === 'down').length;
  }

  /** 盈利时快速卖出 vs 亏损时持有不卖 */
  profitSellCount(): number {
    return this.records.filter(r => r.type === 'sell' && (r.pnl || 0) > 0).length;
  }

  lossSellCount(): number {
    return this.records.filter(r => r.type === 'sell' && (r.pnl || 0) < 0).length;
  }
}
