import Phaser from 'phaser';
import { SaveManager } from '../managers/SaveManager';
import { getGameManager } from '../managers/GameManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    this.add.text(width / 2, height / 3, '股票人生模拟器', {
      fontSize: '28px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 40, '所有的选择都有价格', {
      fontSize: '14px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 新游戏按钮
    const newBg = this.add.rectangle(width / 2, height / 2 + 40, 220, 48, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height / 2 + 40, '🎮 新游戏', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    newBg.on('pointerup', () => {
      SaveManager.deleteSave();
      this.scene.start('CharacterSelectScene');
    });

    // 继续游戏（有存档时显示）
    if (SaveManager.hasSave()) {
      const contBg = this.add.rectangle(width / 2, height / 2 + 100, 220, 48, 0x27ae60, 1)
        .setInteractive({ useHandCursor: true });
      this.add.text(width / 2, height / 2 + 100, '📂 继续游戏', {
        fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      contBg.on('pointerup', () => {
        const saved = SaveManager.load();
        if (saved) {
          const gm = getGameManager(this);
          gm.state.loadState(saved);
          // 根据存档的阶段决定进入哪个场景
          const phase = saved.phase;
          if (phase === 'trading') {
            this.scene.start('TradingScene');
          } else if (phase === 'post-market') {
            this.scene.start('PostMarketScene');
          } else if (phase === 'settlement') {
            this.scene.start('SettlementScene');
          } else {
            this.scene.start('PreMarketScene');
          }
        }
      });

      // 存档信息预览
      const saved = SaveManager.load();
      if (saved) {
        this.add.text(width / 2, height / 2 + 140, `📊 第${saved.currentDay}天 | ¥${saved.cash.toLocaleString()}`, {
          fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
        }).setOrigin(0.5);
      }
    }
  }
}
