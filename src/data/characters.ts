import type { CharacterConfig } from '../models/types';

export const CHARACTERS: Record<string, CharacterConfig> = {
  programmer: {
    id: 'programmer',
    name: '互联网打工人',
    startingCash: 30000,
    dailySalary: 800,
    dailyLivingCost: 200,
    eventFrequency: 0.5,
    specialAbility: '每天1条免费行业信息',
    commissionRate: 0.01,
  },
  // Phase 2+ 添加其他角色
};

export function getCharacter(id: string): CharacterConfig {
  const char = CHARACTERS[id];
  if (!char) {
    throw new Error(`Unknown character: ${id}`);
  }
  return char;
}
