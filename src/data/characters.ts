import type { CharacterConfig } from '../models/types';

export const CHARACTERS: Record<string, CharacterConfig> = {
  programmer: {
    id: 'programmer',
    name: '互联网打工人',
    emoji: '🧑‍💻',
    description: '996的生活，但每天能从工作中获取一条免费行业信息',
    startingCash: 30000,
    dailySalary: 800,
    dailyLivingCost: 200,
    eventFrequency: 0.5,
    specialAbility: '每天1条免费行业信息',
    commissionRate: 0.01,
    difficulty: 3,
    playstyle: '信息流选手',
  },
  sales: {
    id: 'sales',
    name: '销售经理',
    emoji: '👔',
    description: '人脉广，社交花费打8折，但日薪一般',
    startingCash: 20000,
    dailySalary: 500,
    dailyLivingCost: 300,
    eventFrequency: 1.0,
    specialAbility: '社交花费打8折',
    commissionRate: 0.01,
    socialDiscount: 0.8,
    difficulty: 2,
    playstyle: '社交套利型',
  },
  freelancer: {
    id: 'freelancer',
    name: '自由职业者',
    emoji: '🏠',
    description: '资金多但收入不稳定，天然低手续费，生活事件频繁',
    startingCash: 50000,
    dailySalary: [0, 1000],
    dailyLivingCost: 150,
    eventFrequency: 1.5,
    specialAbility: '交易手续费天然0.5%（书店可叠加至0.25%）',
    commissionRate: 0.005,
    difficulty: 4,
    playstyle: '纯操盘手',
  },
  'civil-servant': {
    id: 'civil-servant',
    name: '体制内青年',
    emoji: '👩‍🏫',
    description: '收入低但稳定，每3天获得1次免费研报',
    startingCash: 15000,
    dailySalary: 400,
    dailyLivingCost: 100,
    eventFrequency: 1.0,
    specialAbility: '每3天1次免费研报',
    commissionRate: 0.01,
    researchInterval: 3,
    difficulty: 2,
    playstyle: '稳健价值投资',
  },
};

export const CHARACTER_ORDER = ['programmer', 'sales', 'freelancer', 'civil-servant'];

export function getCharacter(id: string): CharacterConfig {
  const char = CHARACTERS[id];
  if (!char) {
    throw new Error(`Unknown character: ${id}`);
  }
  return char;
}
