import { describe, test, expect, vi } from 'vitest';

// Mock Phaser to avoid 'window is not defined' in Node environment
vi.mock('phaser', () => ({
  default: { Scene: class {} },
}));

import { GameManager } from '../GameManager';
import type { MarketDataPack } from '../StockManager';

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

describe('GameManager', () => {
  test('should initialize with correct sub-managers', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    expect(gm.state).toBeDefined();
    expect(gm.stocks).toBeDefined();
    expect(gm.info).toBeDefined();
    expect(gm.tradeLog).toBeDefined();
  });

  test('should initialize state with character config', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    const state = gm.state.getState();
    expect(state.characterId).toBe('programmer');
    expect(state.cash).toBe(30000); // programmer starting cash
    expect(state.totalDays).toBe(3);
  });

  test('should initialize stocks from market data', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    expect(gm.stocks.getStockIds()).toHaveLength(2);
  });

  test('should return correct commission rate for programmer', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    expect(gm.getCommissionRate()).toBe(0.01);
  });

  test('should return halved commission during discount', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    gm.state.getState().commissionDiscountDays = 3;
    expect(gm.getCommissionRate()).toBe(0.005);
  });

  test('should return correct commission for freelancer', () => {
    const gm = new GameManager(createSampleData(), 'freelancer');
    expect(gm.getCommissionRate()).toBe(0.005);
  });

  test('should return social discount for sales', () => {
    const gm = new GameManager(createSampleData(), 'sales');
    expect(gm.getSocialDiscount()).toBe(0.8);
  });

  test('should return 1.0 social discount for programmer', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    expect(gm.getSocialDiscount()).toBe(1.0);
  });

  test('should reset to new character', () => {
    const gm = new GameManager(createSampleData(), 'programmer');
    gm.tradeLog.log({
      day: 1, tickIndex: 1, stockId: '科技-01',
      type: 'buy', price: 10, amount: 100, recentTrend: 'up',
    });
    expect(gm.tradeLog.totalTrades()).toBe(1);

    gm.reset('sales');
    const state = gm.state.getState();
    expect(state.characterId).toBe('sales');
    expect(gm.tradeLog.totalTrades()).toBe(0);
    expect(gm.stocks.getStockIds()).toHaveLength(2);
  });
});
