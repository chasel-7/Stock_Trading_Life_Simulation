import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../GameStateManager';
import { MoodLevel } from '../../config/constants';

describe('GameStateManager', () => {
  function makeState() {
    return new GameStateManager('programmer', 30000, 15);
  }

  it('should initialize with correct state', () => {
    const gsm = makeState();
    const s = gsm.getState();
    expect(s.cash).toBe(30000);
    expect(s.startingCash).toBe(30000);
    expect(s.currentDay).toBe(1);
    expect(s.totalDays).toBe(15);
    expect(s.characterId).toBe('programmer');
    expect(s.holdings).toEqual([]);
    expect(s.gameOver).toBe(false);
  });

  it('should add and deduct cash', () => {
    const gsm = makeState();
    gsm.addCash(500);
    expect(gsm.getState().cash).toBe(30500);
    gsm.deductCash(200);
    expect(gsm.getState().cash).toBe(30300);
  });

  it('should buy stock', () => {
    const gsm = makeState();
    const ok = gsm.buyStock('A', 10000, 10, 0.01);
    expect(ok).toBe(true);
    // cost = 10000 + 100 commission = 10100
    expect(gsm.getState().cash).toBe(19900);
    expect(gsm.getState().holdings).toHaveLength(1);
    expect(gsm.getState().holdings[0].shares).toBe(1000);
    expect(gsm.getState().holdings[0].costBasis).toBe(10000);
  });

  it('should not buy if insufficient cash', () => {
    const gsm = new GameStateManager('programmer', 100, 15);
    const ok = gsm.buyStock('A', 10000, 10, 0.01);
    expect(ok).toBe(false);
    expect(gsm.getState().cash).toBe(100);
  });

  it('should accumulate when buying same stock', () => {
    const gsm = makeState();
    gsm.buyStock('A', 5000, 10, 0.01);
    gsm.buyStock('A', 5000, 12, 0.01);
    const h = gsm.getState().holdings.find(h => h.stockId === 'A')!;
    expect(h.shares).toBeCloseTo(500 + 416.67, 1);
    expect(h.costBasis).toBe(10000);
  });

  it('should sell stock', () => {
    const gsm = makeState();
    gsm.buyStock('A', 10000, 10, 0.01); // 1000 shares, cash=19900
    const ok = gsm.sellStock('A', 5000, 10, 0.01); // sell 500 shares
    expect(ok).toBe(true);
    // net = 5000 - 50 = 4950
    expect(gsm.getState().cash).toBe(24850);
    expect(gsm.getState().holdings[0].shares).toBe(500);
  });

  it('should not sell more than held', () => {
    const gsm = makeState();
    gsm.buyStock('A', 1000, 10, 0.01);
    const ok = gsm.sellStock('A', 50000, 10, 0.01);
    expect(ok).toBe(false);
  });

  it('should remove holding when fully sold', () => {
    const gsm = makeState();
    gsm.buyStock('A', 10000, 10, 0.01);
    gsm.sellStock('A', 10000, 10, 0.01);
    expect(gsm.getState().holdings).toHaveLength(0);
  });

  it('should advance day', () => {
    const gsm = makeState();
    gsm.advanceDay(0.05, MoodLevel.HAPPY);
    expect(gsm.getState().currentDay).toBe(2);
    expect(gsm.getState().dailySnapshots).toHaveLength(1);
    expect(gsm.getState().dailySnapshots[0].dailyReturn).toBe(0.05);
  });

  it('should detect last day', () => {
    const gsm = new GameStateManager('programmer', 30000, 2);
    expect(gsm.isLastDay()).toBe(false);
    gsm.advanceDay(0, MoodLevel.NEUTRAL);
    expect(gsm.isLastDay()).toBe(true);
  });

  it('should end game', () => {
    const gsm = makeState();
    gsm.endGame('bankrupt');
    expect(gsm.getState().gameOver).toBe(true);
    expect(gsm.getState().gameResult).toBe('bankrupt');
  });

  it('should set phase', () => {
    const gsm = makeState();
    gsm.setPhase('trading');
    expect(gsm.getState().phase).toBe('trading');
  });
});
