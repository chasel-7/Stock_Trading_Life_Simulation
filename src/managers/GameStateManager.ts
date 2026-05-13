import type { GameState, DailySnapshot, InfoItem } from '../models/types';
import { MoodLevel } from '../config/constants';

export class GameStateManager {
  private state: GameState;

  constructor(characterId: string, startingCash: number, totalDays: number) {
    this.state = {
      currentDay: 1,
      totalDays,
      cash: startingCash,
      holdings: [],
      startingCash,
      characterId,
      phase: 'pre-market',
      dailySnapshots: [],
      collectedInfo: [],
      commissionDiscountDays: 0,
      gameOver: false,
      gameResult: 'playing',
    };
  }

  getState(): GameState {
    return this.state;
  }

  /** 从存档恢复状态 */
  loadState(saved: GameState): void {
    this.state = { ...saved };
  }

  // === 资金操作 ===

  addCash(amount: number): void {
    this.state.cash = Math.round((this.state.cash + amount) * 100) / 100;
  }

  deductCash(amount: number): void {
    this.state.cash = Math.round((this.state.cash - amount) * 100) / 100;
  }

  // === 持仓操作 ===

  /** 买入股票 */
  buyStock(stockId: string, amount: number, price: number, commissionRate: number): boolean {
    const commission = Math.round(amount * commissionRate * 100) / 100;
    const totalCost = amount + commission;
    if (totalCost > this.state.cash) return false;

    this.state.cash = Math.round((this.state.cash - totalCost) * 100) / 100;
    const shares = Math.round((amount / price) * 100) / 100;

    const existing = this.state.holdings.find(h => h.stockId === stockId);
    if (existing) {
      existing.shares = Math.round((existing.shares + shares) * 100) / 100;
      existing.costBasis = Math.round((existing.costBasis + amount) * 100) / 100;
    } else {
      this.state.holdings.push({
        stockId,
        shares,
        costBasis: amount,
      });
    }
    return true;
  }

  /** 卖出股票 */
  sellStock(stockId: string, amount: number, price: number, commissionRate: number): boolean {
    const holding = this.state.holdings.find(h => h.stockId === stockId);
    if (!holding) return false;

    const sharesToSell = Math.round((amount / price) * 100) / 100;
    if (sharesToSell > holding.shares) return false;

    const commission = Math.round(amount * commissionRate * 100) / 100;
    const netAmount = amount - commission;
    this.state.cash = Math.round((this.state.cash + netAmount) * 100) / 100;

    // 更新持仓
    const costPerShare = holding.costBasis / holding.shares;
    holding.shares = Math.round((holding.shares - sharesToSell) * 100) / 100;
    holding.costBasis = Math.round(holding.shares * costPerShare * 100) / 100;

    // 清零移除
    if (holding.shares <= 0.01) {
      this.state.holdings = this.state.holdings.filter(h => h.stockId !== stockId);
    }

    return true;
  }

  // === 日期与阶段 ===

  setPhase(phase: GameState['phase']): void {
    this.state.phase = phase;
  }

  advanceDay(dailyReturn: number, mood: MoodLevel): void {
    const snapshot: DailySnapshot = {
      day: this.state.currentDay,
      cash: this.state.cash,
      holdingsValue: 0,  // 由 SettlementManager 补充
      totalAssets: 0,     // 由 SettlementManager 补充
      dailyReturn,
      mood,
    };
    this.state.dailySnapshots.push(snapshot);
    this.state.currentDay++;
  }

  isLastDay(): boolean {
    return this.state.currentDay >= this.state.totalDays;
  }

  // === 游戏结束 ===

  endGame(result: 'bankrupt' | 'win' | 'timeout'): void {
    this.state.gameOver = true;
    this.state.gameResult = result;
  }

  // === 信息管理 ===

  addInfo(info: InfoItem): void {
    this.state.collectedInfo.push(info);
  }

  // === 手续费折扣 ===

  setCommissionDiscount(days: number): void {
    this.state.commissionDiscountDays = days;
  }

  tickCommissionDiscount(): void {
    if (this.state.commissionDiscountDays > 0) {
      this.state.commissionDiscountDays--;
    }
  }
}
