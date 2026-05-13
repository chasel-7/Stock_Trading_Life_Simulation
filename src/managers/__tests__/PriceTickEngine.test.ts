import { describe, it, expect } from 'vitest';
import { PriceTickEngine } from '../PriceTickEngine';

describe('PriceTickEngine', () => {
  it('should emit tick events with correct prices', () => {
    const ticks: Record<string, number[]> = {
      'A': [10, 11, 12],
      'B': [20, 21, 22],
    };
    const engine = new PriceTickEngine(ticks);
    const received: { stockId: string; price: number }[] = [];

    engine.onTick((stockId, price, _idx) => {
      received.push({ stockId, price });
    });

    engine.step(); // tick 0
    expect(received).toEqual([
      { stockId: 'A', price: 10 },
      { stockId: 'B', price: 20 },
    ]);

    received.length = 0;
    engine.step(); // tick 1
    expect(received).toEqual([
      { stockId: 'A', price: 11 },
      { stockId: 'B', price: 21 },
    ]);
  });

  it('should report when all ticks exhausted', () => {
    const engine = new PriceTickEngine({ 'A': [10, 11] });
    engine.step();
    engine.step();
    expect(engine.isFinished()).toBe(true);
  });

  it('should return current prices', () => {
    const engine = new PriceTickEngine({ 'A': [10, 11], 'B': [20, 22] });
    engine.step();
    expect(engine.getCurrentPrices()).toEqual({ 'A': 10, 'B': 20 });
  });

  it('should not be finished before all ticks consumed', () => {
    const engine = new PriceTickEngine({ 'A': [10, 11, 12] });
    engine.step();
    expect(engine.isFinished()).toBe(false);
  });

  it('should call onFinish callback when exhausted', () => {
    const engine = new PriceTickEngine({ 'A': [10, 11] });
    let finished = false;
    engine.onFinish(() => { finished = true; });
    engine.step();
    expect(finished).toBe(false);
    engine.step();
    expect(finished).toBe(true);
  });

  it('should reset correctly', () => {
    const engine = new PriceTickEngine({ 'A': [10, 11] });
    engine.step();
    engine.step();
    expect(engine.isFinished()).toBe(true);
    engine.reset();
    expect(engine.isFinished()).toBe(false);
    expect(engine.getCurrentPrices()).toEqual({});
    expect(engine.getCurrentIndex()).toBe(-1);
  });
});
