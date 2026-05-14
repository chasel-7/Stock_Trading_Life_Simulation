import { MoodLevel } from '../config/constants';

export function calculateMood(dailyReturnRate: number): MoodLevel {
  if (dailyReturnRate < -0.08) return MoodLevel.DEVASTATED;
  if (dailyReturnRate <= -0.02) return MoodLevel.SAD;
  if (dailyReturnRate < 0.02) return MoodLevel.NEUTRAL;
  if (dailyReturnRate <= 0.08) return MoodLevel.HAPPY;
  return MoodLevel.EUPHORIC;
}

const MOOD_EMOJI: Record<MoodLevel, string> = {
  [MoodLevel.DEVASTATED]: '😱',
  [MoodLevel.SAD]: '😔',
  [MoodLevel.NEUTRAL]: '😐',
  [MoodLevel.HAPPY]: '😊',
  [MoodLevel.EUPHORIC]: '🤑',
};

const MOOD_LABEL: Record<MoodLevel, string> = {
  [MoodLevel.DEVASTATED]: '大亏',
  [MoodLevel.SAD]: '小亏',
  [MoodLevel.NEUTRAL]: '平淡',
  [MoodLevel.HAPPY]: '小赚',
  [MoodLevel.EUPHORIC]: '大赚',
};

export function getMoodEmoji(mood: MoodLevel): string {
  return MOOD_EMOJI[mood];
}

export function getMoodLabel(mood: MoodLevel): string {
  return MOOD_LABEL[mood];
}
