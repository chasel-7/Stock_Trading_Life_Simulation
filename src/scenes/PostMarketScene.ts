import Phaser from 'phaser';

export class PostMarketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PostMarketScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, '🌙 盘后社交', {
      fontSize: '24px', color: '#9b59b6', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, '场景选择将在此显示', {
      fontSize: '16px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const btnBg = this.add.rectangle(width / 2, height - 80, 200, 50, 0x27ae60, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 80, '💰 日结算', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btnBg.on('pointerup', () => this.scene.start('SettlementScene'));
  }
}
