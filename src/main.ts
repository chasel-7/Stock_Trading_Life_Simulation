import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { GameManager } from './managers/GameManager';
import { audioManager } from './managers/AudioManager';
import sampleMarket from './data/sampleMarket.json';
import type { MarketDataPack } from './managers/StockManager';

const game = new Phaser.Game(gameConfig);
const gm = new GameManager(sampleMarket as MarketDataPack);
game.registry.set('gameManager', gm);

// 在用户首次交互时初始化音频（浏览器策略要求）
document.addEventListener('pointerdown', () => {
  audioManager.init();
}, { once: true });

