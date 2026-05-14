import { describe, it, expect } from 'vitest';
import { generateDailyBrief } from '../marketTrend';

const mockStocksDay = {
  '消费-01': { open: 20, close: 21, high: 22, low: 19, ticks: [] },
  '消费-02': { open: 15, close: 14, high: 16, low: 13, ticks: [] },
  '科技-01': { open: 30, close: 33, high: 34, low: 29, ticks: [] },
  '科技-02': { open: 25, close: 27, high: 28, low: 24, ticks: [] },
  '制造-01': { open: 18, close: 17, high: 19, low: 16, ticks: [] },
};

describe('generateDailyBrief', () => {
  it('should return trend and active sectors', () => {
    const brief = generateDailyBrief(mockStocksDay);
    expect(brief.trend).toBeDefined();
    expect(['偏多', '偏空', '震荡']).toContain(brief.trend);
    expect(brief.activeSectors.length).toBeGreaterThan(0);
    expect(brief.summary).toContain(brief.trend);
  });

  it('should detect 科技 as active sector', () => {
    const brief = generateDailyBrief(mockStocksDay);
    // 科技板块涨幅最大
    expect(brief.activeSectors).toContain('科技');
  });
});
