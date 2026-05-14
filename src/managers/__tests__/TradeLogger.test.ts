import { describe, test, expect } from 'vitest';
import { TradeLogger, type TradeRecord } from '../TradeLogger';

function makeRecord(overrides: Partial<TradeRecord> = {}): TradeRecord {
  return {
    day: 1,
    tickIndex: 5,
    stockId: 'AAPL',
    type: 'buy',
    price: 100,
    amount: 10,
    recentTrend: 'flat',
    ...overrides,
  };
}

describe('TradeLogger', () => {
  test('should log and retrieve all records', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord());
    logger.log(makeRecord({ stockId: 'MSFT' }));
    expect(logger.getAll()).toHaveLength(2);
  });

  test('should filter by stock', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord({ stockId: 'AAPL' }));
    logger.log(makeRecord({ stockId: 'MSFT' }));
    logger.log(makeRecord({ stockId: 'AAPL' }));
    expect(logger.getByStock('AAPL')).toHaveLength(2);
    expect(logger.getByStock('MSFT')).toHaveLength(1);
  });

  test('should filter by day', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord({ day: 1 }));
    logger.log(makeRecord({ day: 2 }));
    logger.log(makeRecord({ day: 1 }));
    expect(logger.getByDay(1)).toHaveLength(2);
    expect(logger.getByDay(3)).toHaveLength(0);
  });

  test('should count total trades', () => {
    const logger = new TradeLogger();
    expect(logger.totalTrades()).toBe(0);
    logger.log(makeRecord());
    logger.log(makeRecord());
    expect(logger.totalTrades()).toBe(2);
  });

  test('should calculate avg trades per day', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord());
    logger.log(makeRecord());
    logger.log(makeRecord());
    expect(logger.avgTradesPerDay(3)).toBeCloseTo(1);
    expect(logger.avgTradesPerDay(0)).toBe(0);
  });

  test('should count buys after rise', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord({ type: 'buy', recentTrend: 'up' }));
    logger.log(makeRecord({ type: 'buy', recentTrend: 'down' }));
    logger.log(makeRecord({ type: 'sell', recentTrend: 'up' }));
    expect(logger.buysAfterRise()).toBe(1);
  });

  test('should count sells after drop', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord({ type: 'sell', recentTrend: 'down' }));
    logger.log(makeRecord({ type: 'sell', recentTrend: 'up' }));
    logger.log(makeRecord({ type: 'buy', recentTrend: 'down' }));
    expect(logger.sellsAfterDrop()).toBe(1);
  });

  test('should count profit and loss sells', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord({ type: 'sell', pnl: 500 }));
    logger.log(makeRecord({ type: 'sell', pnl: -200 }));
    logger.log(makeRecord({ type: 'sell', pnl: 0 }));
    logger.log(makeRecord({ type: 'sell' })); // no pnl
    expect(logger.profitSellCount()).toBe(1);
    expect(logger.lossSellCount()).toBe(1);
  });

  test('getAll should return a copy', () => {
    const logger = new TradeLogger();
    logger.log(makeRecord());
    const all = logger.getAll();
    all.push(makeRecord());
    expect(logger.getAll()).toHaveLength(1);
  });
});
