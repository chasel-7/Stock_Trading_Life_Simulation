import { GameStateManager } from './GameStateManager';
import { calculateMood } from '../utils/moodCalculator';
import type { MoodLevel } from '../config/constants';

export interface SettlementParams {
  dailySalary: number;
  dailyLivingCost: number;
  sceneSpending: number;
  currentPrices: Record<string, number>;
  eventCosts?: number;
}

export interface SettlementResult {
  salaryIncome: number;
  livingCost: number;
  sceneSpending: number;
  eventCosts: number;
  holdingsValue: number;
  totalAssets: number;
  dailyReturn: number;
  mood: MoodLevel;
  isBankrupt: boolean;
  isWin: boolean;
  isTimeout: boolean;
  cashBefore: number;
  cashAfter: number;
}

export class SettlementManager {
  static settle(gsm: GameStateManager, params: SettlementParams): SettlementResult {
    const stateBefore = gsm.getState();
    const cashBefore = stateBefore.cash;

    // 如果有昨日快照，用昨日总资产作基准，否则用起始资金
    let baseTotalAssets = stateBefore.startingCash;
    if (stateBefore.dailySnapshots.length > 0) {
      baseTotalAssets = stateBefore.dailySnapshots[stateBefore.dailySnapshots.length - 1].totalAssets;
    }

    // 加日薪
    gsm.addCash(params.dailySalary);
    // 扣生活成本
    gsm.deductCash(params.dailyLivingCost);
    // 扣场景花费
    gsm.deductCash(params.sceneSpending);
    // 扣突发事件
    const eventCosts = params.eventCosts || 0;
    if (eventCosts > 0) gsm.deductCash(eventCosts);

    // 计算持仓市值和总资产
    const stateAfter = gsm.getState();
    let holdingsValue = 0;
    for (const h of stateAfter.holdings) {
      const price = params.currentPrices[h.stockId] || 0;
      holdingsValue += h.shares * price;
    }
    holdingsValue = Math.round(holdingsValue * 100) / 100;
    const totalAssets = Math.round((stateAfter.cash + holdingsValue) * 100) / 100;

    // 计算日收益率
    const dailyReturn = baseTotalAssets > 0
      ? (totalAssets - baseTotalAssets) / baseTotalAssets
      : 0;
    const mood = calculateMood(dailyReturn);

    // 判定游戏结束
    const isBankrupt = stateAfter.cash <= 0;
    const isWin = totalAssets >= stateAfter.startingCash * 2;
    const isLastDay = gsm.isLastDay();
    const isTimeout = isLastDay && !isBankrupt && !isWin;

    // 推进天数（记录快照）
    gsm.advanceDay(dailyReturn, mood);
    // 补充快照中的持仓市值和总资产
    const snapshots = gsm.getState().dailySnapshots;
    const lastSnap = snapshots[snapshots.length - 1];
    lastSnap.holdingsValue = holdingsValue;
    lastSnap.totalAssets = totalAssets;

    // 设置游戏结束状态
    if (isBankrupt) gsm.endGame('bankrupt');
    else if (isWin) gsm.endGame('win');
    else if (isTimeout) gsm.endGame('timeout');

    return {
      salaryIncome: params.dailySalary,
      livingCost: params.dailyLivingCost,
      sceneSpending: params.sceneSpending,
      eventCosts,
      holdingsValue,
      totalAssets,
      dailyReturn,
      mood,
      isBankrupt,
      isWin,
      isTimeout,
      cashBefore,
      cashAfter: gsm.getState().cash,
    };
  }
}
