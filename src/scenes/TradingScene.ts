import Phaser from 'phaser';

export class TradingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TradingScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, '📈 盘中交易', {
      fontSize: '24px', color: '#4a90d9', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, '自选股列表将在此显示', {
      fontSize: '16px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 收盘按钮
    const btnBg = this.add.rectangle(width / 2, height - 80, 200, 50, 0xd94a4a, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 80, '🔔 收盘', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btnBg.on('pointerup', () => this.scene.start('PostMarketScene'));
  }
}
