import { describe, it, expect, beforeEach } from 'vitest';
import { LeaderboardManager } from '../LeaderboardManager';

// Polyfill localStorage for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}

describe('LeaderboardManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should submit and retrieve entries', () => {
    const mgr = new LeaderboardManager();
    mgr.submit({
      playerName: '测试玩家', characterId: 'programmer', characterEmoji: '🧑‍💻',
      totalReturn: 0.5, investWisdom: 80, socialROI: 60, overallScore: 70, title: '股海新秀',
    });
    const top = mgr.getTop('total-return', 10);
    expect(top.length).toBe(1);
    expect(top[0].totalReturn).toBe(0.5);
  });

  it('should sort by category field descending', () => {
    const mgr = new LeaderboardManager();
    mgr.submit({ playerName: 'A', characterId: 'programmer', characterEmoji: '🧑‍💻',
      totalReturn: 0.3, investWisdom: 90, socialROI: 50, overallScore: 60, title: 'A' });
    mgr.submit({ playerName: 'B', characterId: 'sales', characterEmoji: '👔',
      totalReturn: 0.8, investWisdom: 70, socialROI: 80, overallScore: 75, title: 'B' });
    const byReturn = mgr.getTop('total-return', 10);
    expect(byReturn[0].playerName).toBe('B');
    const byWisdom = mgr.getTop('invest-wisdom', 10);
    expect(byWisdom[0].playerName).toBe('A');
  });

  it('should limit to top N', () => {
    const mgr = new LeaderboardManager();
    for (let i = 0; i < 20; i++) {
      mgr.submit({ playerName: `P${i}`, characterId: 'programmer', characterEmoji: '🧑‍💻',
        totalReturn: i * 0.1, investWisdom: i, socialROI: i, overallScore: i, title: `T${i}` });
    }
    expect(mgr.getTop('total-return', 10).length).toBe(10);
  });

  it('should persist to localStorage', () => {
    const mgr1 = new LeaderboardManager();
    mgr1.submit({ playerName: 'Test', characterId: 'programmer', characterEmoji: '🧑‍💻',
      totalReturn: 0.5, investWisdom: 80, socialROI: 60, overallScore: 70, title: '测试' });

    const mgr2 = new LeaderboardManager();
    expect(mgr2.getTop('total-return', 10).length).toBe(1);
  });

  it('should return empty for unknown category', () => {
    const mgr = new LeaderboardManager();
    expect(mgr.getTop('unknown' as any, 10)).toEqual([]);
  });
});
