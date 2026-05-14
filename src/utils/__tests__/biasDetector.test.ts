import { describe, it, expect } from 'vitest';
import { detectBiases } from '../biasDetector';
import type { TradeRecord } from '../../managers/TradeLogger';
import type { DailySnapshot } from '../../models/types';
import { MoodLevel } from '../../config/constants';

describe('detectBiases', () => {
  const baseSnapshot: DailySnapshot = {
    day: 1, cash: 30000, holdingsValue: 0,
    totalAssets: 30000, dailyReturn: 0, mood: MoodLevel.NEUTRAL,
  };

  it('should detect 追涨杀跌', () => {
    const trades: TradeRecord[] = [
      { day: 1, tickIndex: 10, stockId: 'A', type: 'buy', price: 20, amount: 5000, recentTrend: 'up' },
      { day: 1, tickIndex: 15, stockId: 'A', type: 'buy', price: 22, amount: 5000, recentTrend: 'up' },
      { day: 2, tickIndex: 5, stockId: 'B', type: 'sell', price: 18, amount: 3000, recentTrend: 'down' },
    ];
    const result = detectBiases(trades, [baseSnapshot], [], 2);
    const chase = result.find(b => b.id === 'chase-rise-kill-fall');
    expect(chase).toBeDefined();
    expect(chase!.severity).toBeGreaterThan(0);
  });

  it('should detect 过度交易', () => {
    const trades: TradeRecord[] = Array.from({ length: 20 }, (_, i) => ({
      day: 1, tickIndex: i, stockId: 'A', type: 'buy' as const,
      price: 20, amount: 1000, recentTrend: 'flat' as const,
    }));
    const result = detectBiases(trades, [baseSnapshot], [], 2);
    const over = result.find(b => b.id === 'over-trading');
    expect(over).toBeDefined();
  });

  it('should detect 损失厌恶', () => {
    const trades: TradeRecord[] = [
      { day: 1, tickIndex: 10, stockId: 'A', type: 'sell', price: 22, amount: 5000, recentTrend: 'up', pnl: 500 },
      { day: 1, tickIndex: 12, stockId: 'B', type: 'sell', price: 22, amount: 5000, recentTrend: 'up', pnl: 200 },
      // No loss sells = holding losers
    ];
    const result = detectBiases(trades, [baseSnapshot], [], 2);
    const loss = result.find(b => b.id === 'loss-aversion');
    expect(loss).toBeDefined();
  });

  it('should return empty array for rational trader', () => {
    const trades: TradeRecord[] = [
      { day: 1, tickIndex: 10, stockId: 'A', type: 'buy', price: 20, amount: 5000, recentTrend: 'flat' },
      { day: 2, tickIndex: 12, stockId: 'A', type: 'sell', price: 22, amount: 5000, recentTrend: 'flat', pnl: 500 },
      { day: 2, tickIndex: 14, stockId: 'B', type: 'sell', price: 18, amount: 3000, recentTrend: 'flat', pnl: -200 },
    ];
    const result = detectBiases(trades, [baseSnapshot], [], 2);
    expect(result.length).toBe(0);
  });
});
