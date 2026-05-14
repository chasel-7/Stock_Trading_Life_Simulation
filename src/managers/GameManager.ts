import Phaser from 'phaser';
import { GameStateManager } from './GameStateManager';
import { StockManager, type MarketDataPack } from './StockManager';
import { InfoManager } from './InfoManager';
import { TradeLogger } from './TradeLogger';
import { getCharacter } from '../data/characters';

export class GameManager {
  public state: GameStateManager;
  public stocks: StockManager;
  public info: InfoManager;
  public tradeLog: TradeLogger;
  private marketData: MarketDataPack;

  constructor(marketData: MarketDataPack, characterId: string = 'programmer') {
    this.marketData = marketData;
    const char = getCharacter(characterId);
    this.state = new GameStateManager(char.id, char.startingCash, marketData.totalDays);
    this.stocks = new StockManager(marketData);
    this.info = new InfoManager(this.stocks.getStockIds());
    this.tradeLog = new TradeLogger();
  }

  getCommissionRate(): number {
    const char = getCharacter(this.state.getState().characterId);
    const s = this.state.getState();
    return s.commissionDiscountDays > 0
      ? char.commissionRate / 2
      : char.commissionRate;
  }

  /** 获取社交花费折扣（销售经理0.8，其他1.0） */
  getSocialDiscount(): number {
    const char = getCharacter(this.state.getState().characterId);
    return char.socialDiscount || 1.0;
  }

  /** 重新初始化（新游戏时调用） */
  reset(characterId: string): void {
    const char = getCharacter(characterId);
    this.state = new GameStateManager(char.id, char.startingCash, this.marketData.totalDays);
    this.stocks = new StockManager(this.marketData);
    this.info = new InfoManager(this.stocks.getStockIds());
    this.tradeLog = new TradeLogger();
  }
}

export function getGameManager(scene: Phaser.Scene): GameManager {
  return scene.registry.get('gameManager') as GameManager;
}
