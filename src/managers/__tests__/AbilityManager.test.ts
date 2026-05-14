import { describe, test, expect } from 'vitest';
import { AbilityManager } from '../AbilityManager';

const stockIds = ['STOCK_A', 'STOCK_B', 'STOCK_C'];

describe('AbilityManager', () => {
  describe('programmerDailyInfo', () => {
    test('should return an InfoItem with valid fields', () => {
      const info = AbilityManager.programmerDailyInfo(stockIds, 1);
      expect(info.stockId).toBeDefined();
      expect(stockIds).toContain(info.stockId);
      expect(info.source).toBe('工作内部');
      expect(info.accuracy).toBe(0.55);
      expect(info.day).toBe(1);
      expect(info.content.length).toBeGreaterThan(0);
    });
  });

  describe('civilServantResearch', () => {
    test('should return research on interval days (day 0, 3, 6...)', () => {
      const info = AbilityManager.civilServantResearch(stockIds, 0);
      expect(info).not.toBeNull();
      expect(info!.source).toBe('免费研报');
      expect(info!.accuracy).toBe(0.75);
    });

    test('should return null on non-interval days', () => {
      const info1 = AbilityManager.civilServantResearch(stockIds, 1);
      const info2 = AbilityManager.civilServantResearch(stockIds, 2);
      expect(info1).toBeNull();
      expect(info2).toBeNull();
    });
  });

  describe('getPreMarketAbility', () => {
    test('programmer should get info + message', () => {
      const result = AbilityManager.getPreMarketAbility('programmer', stockIds, 1);
      expect(result.info).toBeDefined();
      expect(result.message).toContain('免费行业信息');
    });

    test('sales should get discount message', () => {
      const result = AbilityManager.getPreMarketAbility('sales', stockIds, 1);
      expect(result.info).toBeUndefined();
      expect(result.message).toContain('8折');
    });

    test('freelancer should get commission message', () => {
      const result = AbilityManager.getPreMarketAbility('freelancer', stockIds, 1);
      expect(result.info).toBeUndefined();
      expect(result.message).toContain('0.5%');
    });

    test('civil-servant on interval day should get research', () => {
      const result = AbilityManager.getPreMarketAbility('civil-servant', stockIds, 3);
      expect(result.info).toBeDefined();
      expect(result.message).toContain('免费研报');
    });

    test('civil-servant on non-interval day shows countdown', () => {
      const result = AbilityManager.getPreMarketAbility('civil-servant', stockIds, 1);
      expect(result.info).toBeUndefined();
      expect(result.message).toContain('距离下次');
    });

    test('unknown character should return empty', () => {
      const result = AbilityManager.getPreMarketAbility('unknown', stockIds, 1);
      expect(result.info).toBeUndefined();
      expect(result.message).toBeUndefined();
    });
  });
});
