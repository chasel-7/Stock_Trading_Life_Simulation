import { describe, it, expect } from 'vitest';
import { calculateScores, generateTitle } from '../scoring';

describe('calculateScores', () => {
  it('should return 4 dimension scores', () => {
    const scores = calculateScores({
      totalReturn: 0.3,
      biasCount: 1,
      avgBiasSeverity: 0.3,
      totalInfoCollected: 5,
      infoActedUpon: 3,
      totalSceneSpending: 2000,
      totalSalaryEarned: 12000,
      moodVariance: 0.5,
      daysPlayed: 15,
    });
    expect(scores.investWisdom).toBeGreaterThanOrEqual(0);
    expect(scores.investWisdom).toBeLessThanOrEqual(100);
    expect(scores.socialReturn).toBeGreaterThanOrEqual(0);
    expect(scores.lifeBalance).toBeGreaterThanOrEqual(0);
    expect(scores.mentalStability).toBeGreaterThanOrEqual(0);
  });

  it('should give high investWisdom for good return and low bias', () => {
    const scores = calculateScores({
      totalReturn: 0.5,
      biasCount: 0,
      avgBiasSeverity: 0,
      totalInfoCollected: 5,
      infoActedUpon: 3,
      totalSceneSpending: 3000,
      totalSalaryEarned: 12000,
      moodVariance: 0.1,
      daysPlayed: 15,
    });
    expect(scores.investWisdom).toBeGreaterThan(70);
  });
});

describe('generateTitle', () => {
  it('should return a title for high scores', () => {
    const title = generateTitle({
      investWisdom: 90, socialReturn: 80, lifeBalance: 85, mentalStability: 75,
    });
    expect(title.title).toBeTruthy();
    expect(title.summary).toBeTruthy();
  });

  it('should return different title for low scores', () => {
    const title = generateTitle({
      investWisdom: 20, socialReturn: 30, lifeBalance: 25, mentalStability: 15,
    });
    expect(title.title).not.toBe('');
  });

  it('should always return a fallback title', () => {
    const title = generateTitle({
      investWisdom: 50, socialReturn: 50, lifeBalance: 50, mentalStability: 50,
    });
    expect(title.title).toBeTruthy();
    expect(title.emoji).toBeTruthy();
  });
});
