import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { GameManager } from './managers/GameManager';
import sampleMarket from './data/sampleMarket.json';
import type { MarketDataPack } from './managers/StockManager';

const game = new Phaser.Game(gameConfig);
const gm = new GameManager(sampleMarket as MarketDataPack);
game.registry.set('gameManager', gm);
