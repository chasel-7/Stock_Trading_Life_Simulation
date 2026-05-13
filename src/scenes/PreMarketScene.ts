import Phaser from 'phaser';

export class PreMarketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreMarketScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, 40, '☀️ 盘前阶段', {
      fontSize: '24px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 40, '📰 今日市场概览', {
      fontSize: '18px', color: '#ccc', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, '大盘趋势：偏多 | 活跃板块：科技', {
      fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 进入盘中按钮
    const btnBg = this.add.rectangle(width / 2, height - 120, 200, 50, 0x4a90d9, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 120, '📈 开始交易', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btnBg.on('pointerup', () => this.scene.start('TradingScene'));

    // 跳过按钮
    const skipBg = this.add.rectangle(width / 2, height - 60, 200, 40, 0x666666, 0.7)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 60, '⏭️ 不看盘', {
      fontSize: '14px', color: '#ccc', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    skipBg.on('pointerup', () => this.scene.start('PostMarketScene'));
  }
}
