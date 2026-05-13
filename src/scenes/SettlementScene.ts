import Phaser from 'phaser';

export class SettlementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettlementScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, '💰 日结算', {
      fontSize: '24px', color: '#f39c12', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, '结算详情将在此显示', {
      fontSize: '16px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 下一天按钮
    const btnBg = this.add.rectangle(width / 2, height - 80, 200, 50, 0x4a90d9, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 80, '➡️ 下一天', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btnBg.on('pointerup', () => this.scene.start('PreMarketScene'));
  }
}
