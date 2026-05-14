import type { TradeRecord } from '../managers/TradeLogger';
import type { DailySnapshot } from '../models/types';
import { MoodLevel } from '../config/constants';

export interface BiasResult {
  id: string;
  name: string;
  emoji: string;
  severity: number;  // 0~1
  description: string;
  advice: string;
}

export function detectBiases(
  trades: TradeRecord[],
  _snapshots: DailySnapshot[],
  sceneChoices: { sceneId: string; cost: number; mood: MoodLevel }[],
  totalDays: number,
  collectedInfoCount: number = 0,
  finalHoldings: { stockId: string; costBasis: number; currentValue: number }[] = [],
): BiasResult[] {
  const results: BiasResult[] = [];

  // 1. 追涨杀跌
  const chaseCount = trades.filter(t => t.type === 'buy' && t.recentTrend === 'up').length;
  const killCount = trades.filter(t => t.type === 'sell' && t.recentTrend === 'down').length;
  const totalTrades = trades.length || 1;
  const chaseSeverity = (chaseCount + killCount) / totalTrades;
  if (chaseSeverity > 0.2) {
    results.push({
      id: 'chase-rise-kill-fall',
      name: '追涨杀跌',
      emoji: '📈📉',
      severity: Math.min(chaseSeverity, 1),
      description: `你有${chaseCount}次在连涨后买入，${killCount}次在连跌后卖出`,
      advice: '涨了不一定继续涨，跌了不一定继续跌。逆势思考，顺势操作。',
    });
  }

  // 2. 过度交易
  const avgPerDay = trades.length / Math.max(totalDays, 1);
  if (avgPerDay > 4) {
    results.push({
      id: 'over-trading',
      name: '过度交易',
      emoji: '🔄',
      severity: Math.min(avgPerDay / 10, 1),
      description: `你平均每天交易${avgPerDay.toFixed(1)}次，远超合理水平`,
      advice: '频繁交易≠更高收益，手续费在悄悄侵蚀利润。',
    });
  }

  // 3. 损失厌恶（盈利快跑，亏损死扛）
  const profitSells = trades.filter(t => t.type === 'sell' && (t.pnl || 0) > 0).length;
  const lossSells = trades.filter(t => t.type === 'sell' && (t.pnl || 0) < 0).length;
  const sellTotal = profitSells + lossSells;
  if (sellTotal > 0 && profitSells > lossSells * 2) {
    results.push({
      id: 'loss-aversion',
      name: '损失厌恶',
      emoji: '😰',
      severity: Math.min(profitSells / Math.max(sellTotal, 1), 1),
      description: `盈利卖出${profitSells}次 vs 止损卖出${lossSells}次 —— 赚了就跑，亏了死扛`,
      advice: '"割肉太慢、跑太快"是最常见的散户心理。',
    });
  }

  // 4. 信息过载（收集很多信息但交易很少，信息未转化为操作）
  if (collectedInfoCount > 0) {
    const infoToTradeRatio = collectedInfoCount / Math.max(trades.length, 1);
    if (infoToTradeRatio > 3) {
      results.push({
        id: 'info-overload',
        name: '信息过载',
        emoji: '📡',
        severity: Math.min(infoToTradeRatio / 10, 1),
        description: `你收集了${collectedInfoCount}条信息但只交易了${trades.length}次，信息未转化为行动`,
        advice: '信息不是越多越好，关键是筛选和行动。信息过载的反面是决策疲劳。',
      });
    }
  }

  // 5. 消费冲动（赚钱后选高消费场景）
  const euphoriaSplurge = sceneChoices.filter(
    c => (c.mood === MoodLevel.HAPPY || c.mood === MoodLevel.EUPHORIC) && c.cost >= 300
  ).length;
  const totalSceneChoices = sceneChoices.length || 1;
  if (euphoriaSplurge / totalSceneChoices > 0.3) {
    results.push({
      id: 'spending-impulse',
      name: '消费冲动',
      emoji: '💸',
      severity: Math.min(euphoriaSplurge / totalSceneChoices, 1),
      description: `赚钱的日子里，你${euphoriaSplurge}次选择了高消费场景`,
      advice: '赚的钱转眼花掉，利润回吐是散户通病。',
    });
  }

  // 6. 沉没成本（深度亏损仍持有，不愿止损）
  const deepLossHoldings = finalHoldings.filter(
    h => h.currentValue < h.costBasis * 0.8  // 亏损超20%
  );
  if (deepLossHoldings.length > 0) {
    const worstLoss = deepLossHoldings.reduce(
      (worst, h) => {
        const lossPct = (h.currentValue - h.costBasis) / h.costBasis;
        return lossPct < worst ? lossPct : worst;
      }, 0
    );
    results.push({
      id: 'sunk-cost',
      name: '沉没成本',
      emoji: '⛓️',
      severity: Math.min(Math.abs(worstLoss), 1),
      description: `游戏结束时你仍持有${deepLossHoldings.length}支亏损超20%的股票`,
      advice: '"已经亏了这么多不想割"是典型沉没成本谬误。每天都是新的决策。',
    });
  }

  return results;
}
