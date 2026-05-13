import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { PreMarketScene } from '../scenes/PreMarketScene';
import { TradingScene } from '../scenes/TradingScene';
import { PostMarketScene } from '../scenes/PostMarketScene';
import { SettlementScene } from '../scenes/SettlementScene';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, CharacterSelectScene, PreMarketScene, TradingScene, PostMarketScene, SettlementScene],
};

