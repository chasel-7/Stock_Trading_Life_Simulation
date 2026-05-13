import Phaser from 'phaser';
import { GameStateManager } from './GameStateManager';
import { StockManager, type MarketDataPack } from './StockManager';
import { getCharacter } from '../data/characters';

export class GameManager {
  public state: GameStateManager;
  public stocks: StockManager;

  constructor(marketData: MarketDataPack) {
    const char = getCharacter('programmer');
    this.state = new GameStateManager(char.id, char.startingCash, marketData.totalDays);
    this.stocks = new StockManager(marketData);
  }

  getCommissionRate(): number {
    const char = getCharacter(this.state.getState().characterId);
    const s = this.state.getState();
    return s.commissionDiscountDays > 0
      ? char.commissionRate / 2
      : char.commissionRate;
  }
}

export function getGameManager(scene: Phaser.Scene): GameManager {
  return scene.registry.get('gameManager') as GameManager;
}
