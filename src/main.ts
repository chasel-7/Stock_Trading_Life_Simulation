import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { GameManager } from './managers/GameManager';
import { audioManager } from './managers/AudioManager';
import { MarketGenerator } from './managers/MarketGenerator';
import sampleMarket from './data/sampleMarket.json';
import type { MarketDataPack } from './managers/StockManager';

const game = new Phaser.Game(gameConfig);

// 默认使用固定行情
const gm = new GameManager(sampleMarket as MarketDataPack);
game.registry.set('gameManager', gm);

// 暴露行情切换方法到 registry（供 BootScene 调用）
game.registry.set('switchToRandomMarket', () => {
  const randomData = MarketGenerator.generate();
  const newGm = new GameManager(randomData);
  game.registry.set('gameManager', newGm);
});

game.registry.set('switchToFixedMarket', () => {
  const newGm = new GameManager(sampleMarket as MarketDataPack);
  game.registry.set('gameManager', newGm);
});

// 在用户首次交互时初始化音频（浏览器策略要求）
document.addEventListener('pointerdown', () => {
  audioManager.init();
}, { once: true });

