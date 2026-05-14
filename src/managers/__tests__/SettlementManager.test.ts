import { describe, it, expect } from 'vitest';
import { SettlementManager } from '../SettlementManager';
import { GameStateManager } from '../GameStateManager';

describe('SettlementManager', () => {
  function makeState() {
    return new GameStateManager('programmer', 30000, 15);
  }

  it('should add salary and deduct living cost', () => {
    const gsm = makeState();
    const result = SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: {},
    });
    // 30000 + 800 - 200 = 30600
    expect(gsm.getState().cash).toBe(30600);
    expect(result.salaryIncome).toBe(800);
    expect(result.livingCost).toBe(200);
  });

  it('should deduct scene spending', () => {
    const gsm = makeState();
    SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 300,
      currentPrices: {},
    });
    // 30000 + 800 - 200 - 300 = 30300
    expect(gsm.getState().cash).toBe(30300);
  });

  it('should detect bankruptcy', () => {
    const gsm = new GameStateManager('programmer', 100, 15);
    const result = SettlementManager.settle(gsm, {
      dailySalary: 0,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: {},
    });
    expect(result.isBankrupt).toBe(true);
    expect(gsm.getState().gameOver).toBe(true);
    expect(gsm.getState().gameResult).toBe('bankrupt');
  });

  it('should detect win condition', () => {
    const gsm = new GameStateManager('programmer', 55000, 15);
    const result = SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: { 'A': 100 },
    });
    // cash = 55600, startingCash = 55000, target = 110000
    // No holdings, so total = 55600 < 110000, not win
    expect(result.isWin).toBe(false);
  });

  it('should calculate daily return rate', () => {
    const gsm = makeState();
    // 买一些股票先
    gsm.buyStock('A', 10000, 10, 0.01);
    // cash = 30000 - 10000 - 100 = 19900, holdings: 1000 shares of A
    const result = SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: { 'A': 12 }, // A涨到12
    });
    // holdingsValue = 1000 * 12 = 12000
    // cash after settle = 19900 + 800 - 200 = 20500
    // totalAssets = 20500 + 12000 = 32500
    // dailyReturn = (32500 - 30000) / 30000 = 0.0833
    expect(result.totalAssets).toBe(32500);
    expect(result.dailyReturn).toBeCloseTo(0.0833, 3);
  });

  it('should advance day after settlement', () => {
    const gsm = makeState();
    SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: {},
    });
    expect(gsm.getState().currentDay).toBe(2);
    expect(gsm.getState().dailySnapshots.length).toBe(1);
  });

  it('should detect timeout on last day', () => {
    const gsm = new GameStateManager('programmer', 30000, 1);
    const result = SettlementManager.settle(gsm, {
      dailySalary: 800,
      dailyLivingCost: 200,
      sceneSpending: 0,
      currentPrices: {},
    });
    expect(result.isTimeout).toBe(true);
    expect(gsm.getState().gameOver).toBe(true);
    expect(gsm.getState().gameResult).toBe('timeout');
  });
});
