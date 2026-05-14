export interface ScoreInput {
  totalReturn: number;
  biasCount: number;
  avgBiasSeverity: number;
  totalInfoCollected: number;
  infoActedUpon: number;
  totalSceneSpending: number;
  totalSalaryEarned: number;
  moodVariance: number;
  daysPlayed: number;
}

export interface ScoreResult {
  investWisdom: number;     // 0~100
  socialReturn: number;     // 0~100
  lifeBalance: number;      // 0~100
  mentalStability: number;  // 0~100
}

export interface TitleResult {
  title: string;
  summary: string;
  emoji: string;
}

export function calculateScores(input: ScoreInput): ScoreResult {
  // 投资智慧：收益率 + 低偏差
  const returnScore = Math.min(Math.max((input.totalReturn + 0.5) * 80, 0), 100);
  const biasDeduction = input.biasCount * input.avgBiasSeverity * 20;
  const investWisdom = Math.round(Math.max(returnScore - biasDeduction, 0));

  // 社交回报：信息收集和利用效率
  const infoRatio = input.totalInfoCollected > 0
    ? input.infoActedUpon / input.totalInfoCollected : 0;
  const socialReturn = Math.round(Math.min(
    (input.totalInfoCollected * 8 + infoRatio * 40), 100
  ));

  // 生活平衡：场景消费占总收入比例（适度消费得高分）
  const spendRatio = input.totalSalaryEarned > 0
    ? input.totalSceneSpending / input.totalSalaryEarned : 0;
  // 最佳消费比例约0.3~0.5
  const balanceScore = spendRatio < 0.1 ? 40 :
                       spendRatio < 0.3 ? 70 :
                       spendRatio < 0.5 ? 100 :
                       spendRatio < 0.8 ? 60 : 30;
  const lifeBalance = Math.round(balanceScore);

  // 心态稳定：心情波动小得高分
  const stabilityBase = Math.max(100 - input.moodVariance * 150, 0);
  const mentalStability = Math.round(Math.min(stabilityBase, 100));

  return { investWisdom, socialReturn, lifeBalance, mentalStability };
}

const TITLES: { condition: (s: ScoreResult) => boolean; title: string; emoji: string; summary: string }[] = [
  {
    condition: s => s.investWisdom >= 85 && s.mentalStability >= 80,
    title: '股神附体', emoji: '🏆',
    summary: '冷静、理性、收益出色，你就是传说中的散户之王。',
  },
  {
    condition: s => s.socialReturn >= 85,
    title: '社交达人', emoji: '🤝',
    summary: '你的信息网络价值千金，人脉就是你最大的资产。',
  },
  {
    condition: s => s.lifeBalance >= 85 && s.mentalStability >= 80,
    title: '生活赢家', emoji: '🌟',
    summary: '工作生活两不误，你活出了最好的样子。',
  },
  {
    condition: s => s.investWisdom <= 30 && s.mentalStability <= 30,
    title: '韭菜本菜', emoji: '🥬',
    summary: '别灰心，每个老韭菜都是从嫩韭菜成长起来的。',
  },
  {
    condition: s => s.investWisdom >= 70,
    title: '理性投资者', emoji: '📊',
    summary: '你展现了不错的投资判断力，继续保持。',
  },
  {
    condition: s => s.mentalStability >= 80,
    title: '淡定哥/姐', emoji: '😎',
    summary: '任凭风浪起，稳坐钓鱼台。你的心态令人羡慕。',
  },
  {
    condition: s => s.lifeBalance >= 70,
    title: '佛系玩家', emoji: '🧘',
    summary: '炒股只是生活的一部分，你深谙此道。',
  },
  {
    condition: () => true, // fallback
    title: '股市新手', emoji: '🌱',
    summary: '这只是开始，每一次经历都是成长。',
  },
];

export function generateTitle(scores: ScoreResult): TitleResult {
  for (const t of TITLES) {
    if (t.condition(scores)) {
      return { title: t.title, emoji: t.emoji, summary: t.summary };
    }
  }
  return TITLES[TITLES.length - 1]; // fallback
}
