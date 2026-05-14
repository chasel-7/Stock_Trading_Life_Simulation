import { describe, it, expect } from 'vitest';
import { calculateMood, getMoodEmoji, getMoodLabel } from '../moodCalculator';
import { MoodLevel } from '../../config/constants';

describe('moodCalculator', () => {
  it('should return DEVASTATED for < -8%', () => {
    expect(calculateMood(-0.10)).toBe(MoodLevel.DEVASTATED);
    expect(calculateMood(-0.09)).toBe(MoodLevel.DEVASTATED);
  });

  it('should return SAD for -8% to -2%', () => {
    expect(calculateMood(-0.05)).toBe(MoodLevel.SAD);
    expect(calculateMood(-0.02)).toBe(MoodLevel.SAD);
  });

  it('should return NEUTRAL for -2% to +2%', () => {
    expect(calculateMood(0)).toBe(MoodLevel.NEUTRAL);
    expect(calculateMood(0.01)).toBe(MoodLevel.NEUTRAL);
    expect(calculateMood(-0.019)).toBe(MoodLevel.NEUTRAL);
  });

  it('should return HAPPY for +2% to +8%', () => {
    expect(calculateMood(0.05)).toBe(MoodLevel.HAPPY);
  });

  it('should return EUPHORIC for > +8%', () => {
    expect(calculateMood(0.10)).toBe(MoodLevel.EUPHORIC);
  });

  it('should return correct emojis', () => {
    expect(getMoodEmoji(MoodLevel.DEVASTATED)).toBe('😱');
    expect(getMoodEmoji(MoodLevel.SAD)).toBe('😔');
    expect(getMoodEmoji(MoodLevel.NEUTRAL)).toBe('😐');
    expect(getMoodEmoji(MoodLevel.HAPPY)).toBe('😊');
    expect(getMoodEmoji(MoodLevel.EUPHORIC)).toBe('🤑');
  });

  it('should return correct labels', () => {
    expect(getMoodLabel(MoodLevel.DEVASTATED)).toBe('大亏');
    expect(getMoodLabel(MoodLevel.EUPHORIC)).toBe('大赚');
  });
});
