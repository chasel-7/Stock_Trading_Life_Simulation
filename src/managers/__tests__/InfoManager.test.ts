import { describe, it, expect } from 'vitest';
import { InfoManager } from '../InfoManager';

describe('InfoManager', () => {
  it('should generate info for a random stock', () => {
    const stockIds = ['消费-01', '科技-01', '制造-01'];
    const mgr = new InfoManager(stockIds);
    const info = mgr.generateInfo('bar', 0.5, 3);
    expect(info).not.toBeNull();
    expect(stockIds).toContain(info!.stockId);
    expect(info!.accuracy).toBe(0.5);
    expect(info!.day).toBe(3);
  });

  it('should detect info chain (2+ sources for same stock)', () => {
    const mgr = new InfoManager(['A', 'B']);
    mgr.addInfo({ stockId: 'A', source: 'bar', content: 'test1', accuracy: 0.5, day: 1 });
    expect(mgr.checkChain('A')).toBe(false);
    mgr.addInfo({ stockId: 'A', source: 'stall', content: 'test2', accuracy: 0.6, day: 2 });
    expect(mgr.checkChain('A')).toBe(true);
  });

  it('should return all info for a stock', () => {
    const mgr = new InfoManager(['A']);
    mgr.addInfo({ stockId: 'A', source: 's1', content: 'c1', accuracy: 0.5, day: 1 });
    mgr.addInfo({ stockId: 'A', source: 's2', content: 'c2', accuracy: 0.6, day: 2 });
    expect(mgr.getInfoForStock('A').length).toBe(2);
  });

  it('should return empty for unknown stock', () => {
    const mgr = new InfoManager(['A']);
    expect(mgr.getInfoForStock('B').length).toBe(0);
  });

  it('should return null if no stockIds', () => {
    const mgr = new InfoManager([]);
    expect(mgr.generateInfo('bar', 0.5, 1)).toBeNull();
  });

  it('should track all info', () => {
    const mgr = new InfoManager(['A', 'B']);
    mgr.addInfo({ stockId: 'A', source: 's1', content: 'c1', accuracy: 0.5, day: 1 });
    mgr.addInfo({ stockId: 'B', source: 's2', content: 'c2', accuracy: 0.6, day: 2 });
    expect(mgr.getAllInfo().length).toBe(2);
  });
});
