import { describe, it, expect } from 'vitest';
import { StockManager, type MarketDataPack } from '../StockManager';

function createSampleData(): MarketDataPack {
  return {
    totalDays: 3,
    stocks: [
      {
        id: '科技-01',
        sector: '科技' as any,
        keywords: ['芯片'],
        isRecommended: true,
        dailyData: [
          { open: 10, close: 11, high: 12, low: 9.5, ticks: [10, 10.2, 10.5, 10.8, 11] },
          { open: 11, close: 10.5, high: 11.5, low: 10, ticks: [11, 10.8, 10.6, 10.3, 10.5] },
          { open: 10.5, close: 12, high: 12.5, low: 10.2, ticks: [10.5, 11, 11.5, 11.8, 12] },
        ],
      },
      {
        id: '消费-01',
        sector: '消费' as any,
        keywords: ['白酒'],
        isRecommended: false,
        dailyData: [
          { open: 50, close: 52, high: 53, low: 49, ticks: [50, 50.5, 51, 51.5, 52] },
          { open: 52, close: 48, high: 52.5, low: 47, ticks: [52, 51, 50, 49, 48] },
          { open: 48, close: 55, high: 56, low: 47.5, ticks: [48, 50, 52, 54, 55] },
        ],
      },
    ],
  };
}

describe('StockManager', () => {
  it('should load stock data', () => {
    const sm = new StockManager(createSampleData());
    expect(sm.getStockIds()).toHaveLength(2);
    expect(sm.getTotalDays()).toBe(3);
  });

  it('should get daily data', () => {
    const sm = new StockManager(createSampleData());
    const dd = sm.getDailyData('科技-01', 0);
    expect(dd.open).toBe(10);
    expect(dd.close).toBe(11);
  });

  it('should get close price', () => {
    const sm = new StockManager(createSampleData());
    expect(sm.getClosePrice('科技-01', 1)).toBe(10.5);
  });

  it('should get tick price', () => {
    const sm = new StockManager(createSampleData());
    expect(sm.getTickPrice('科技-01', 0, 2)).toBe(10.5);
  });

  it('should throw for invalid stock', () => {
    const sm = new StockManager(createSampleData());
    expect(() => sm.getDailyData('不存在', 0)).toThrow('not found');
  });

  it('should throw for invalid day', () => {
    const sm = new StockManager(createSampleData());
    expect(() => sm.getDailyData('科技-01', 99)).toThrow('out of range');
  });

  it('should return recommended stocks', () => {
    const sm = new StockManager(createSampleData());
    const recs = sm.getRecommendedStocks();
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe('科技-01');
  });
});
