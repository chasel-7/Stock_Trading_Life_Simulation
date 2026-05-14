import { describe, it, expect } from 'vitest';
import { LifeEventManager } from '../LifeEventManager';

describe('LifeEventManager', () => {
  it('should roll events based on frequency', () => {
    // frequency=1 means ~100% chance of 1 event
    const mgr = new LifeEventManager(1.0);
    // Run many times to verify statistical behavior
    let triggered = 0;
    for (let i = 0; i < 100; i++) {
      const events = mgr.rollDailyEvents(false);
      if (events.length > 0) triggered++;
    }
    // With freq 1.0, should trigger most of the time
    expect(triggered).toBeGreaterThan(50);
  });

  it('should filter big-loss events when not big loss', () => {
    const mgr = new LifeEventManager(2.0);
    const events = mgr.rollDailyEvents(false);
    const bigLossEvents = events.filter(e => e.trigger === 'big-loss');
    expect(bigLossEvents.length).toBe(0);
  });

  it('should include big-loss events when applicable', () => {
    const mgr = new LifeEventManager(5.0); // high freq to ensure trigger
    let found = false;
    for (let i = 0; i < 50; i++) {
      const events = mgr.rollDailyEvents(true);
      if (events.some(e => e.trigger === 'big-loss')) found = true;
    }
    expect(found).toBe(true);
  });

  it('should calculate forced cost', () => {
    const cost = LifeEventManager.calculateCost(
      { id: 'test', description: '', emoji: '', type: 'forced', forcedCost: 2000, trigger: 'any' },
      10000, 0,
    );
    expect(cost).toBe(2000);
  });

  it('should calculate dynamic percent-of-cash cost', () => {
    const cost = LifeEventManager.calculateCost(
      {
        id: 'test', description: '', emoji: '', type: 'forced',
        dynamicCost: 'percent-of-cash', dynamicRate: 0.2,
        trigger: 'any',
      },
      10000, 0,
    );
    expect(cost).toBe(2000);
  });

  it('should calculate dynamic percent-of-loss cost', () => {
    const cost = LifeEventManager.calculateCost(
      {
        id: 'test', description: '', emoji: '', type: 'forced',
        dynamicCost: 'percent-of-loss', dynamicRate: 0.2,
        trigger: 'big-loss',
      },
      10000, -5000,
    );
    expect(cost).toBe(1000); // 20% of |5000|
  });

  it('should calculate option A dynamic cost', () => {
    const cost = LifeEventManager.calculateOptionACost(
      {
        id: 'test', description: '', emoji: '', type: 'choice',
        trigger: 'any',
        optionA: { label: '', cost: 'dynamic', dynamicRate: 0.2, effect: '' },
      },
      10000,
    );
    expect(cost).toBe(2000);
  });

  it('should return 0 frequency events as empty', () => {
    const mgr = new LifeEventManager(0);
    const events = mgr.rollDailyEvents(false);
    expect(events.length).toBe(0);
  });
});
