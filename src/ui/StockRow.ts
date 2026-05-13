import Phaser from 'phaser';

export interface StockRowData {
  stockId: string;
  name: string;
  price: number;
  changePercent: number;
  isRecommended: boolean;
}

export class StockRow extends Phaser.GameObjects.Container {
  private priceTxt: Phaser.GameObjects.Text;
  private changeTxt: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Rectangle;
  private flashTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, data: StockRowData) {
    super(scene, x, y);
    scene.add.existing(this);

    const ROW_H = 56;

    // 背景
    this.bg = scene.add.rectangle(0, 0, width, ROW_H, 0x1e1e3a, 0.8)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.add(this.bg);

    // 推荐股标记
    const prefix = data.isRecommended ? '⭐ ' : '';

    // 股票名称
    const nameTxt = scene.add.text(12, ROW_H / 2, `${prefix}${data.name}`, {
      fontSize: '15px', color: '#e0e0e0', fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.add(nameTxt);

    // 现价
    this.priceTxt = scene.add.text(width - 120, ROW_H / 2, `¥${data.price.toFixed(2)}`, {
      fontSize: '16px', color: '#e0e0e0', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
    this.add(this.priceTxt);

    // 涨跌幅
    const changeColor = data.changePercent >= 0 ? '#e74c3c' : '#2ecc71';
    const changeSign = data.changePercent >= 0 ? '+' : '';
    this.changeTxt = scene.add.text(width - 12, ROW_H / 2,
      `${changeSign}${data.changePercent.toFixed(2)}%`, {
      fontSize: '15px', color: changeColor, fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
    this.add(this.changeTxt);

    // 分隔线
    const line = scene.add.rectangle(0, ROW_H - 1, width, 1, 0x333366, 0.5).setOrigin(0, 0);
    this.add(line);
  }

  /** 更新价格和涨跌幅，触发闪烁 */
  updatePrice(newPrice: number, changePercent: number): void {
    const oldPrice = parseFloat(this.priceTxt.text.replace('¥', ''));
    this.priceTxt.setText(`¥${newPrice.toFixed(2)}`);

    const changeColor = changePercent >= 0 ? '#e74c3c' : '#2ecc71';
    const changeSign = changePercent >= 0 ? '+' : '';
    this.changeTxt.setText(`${changeSign}${changePercent.toFixed(2)}%`);
    this.changeTxt.setColor(changeColor);

    // 闪烁效果
    if (newPrice !== oldPrice) {
      const flashColor = newPrice > oldPrice ? '#ff6b6b' : '#51cf66';
      this.priceTxt.setColor(flashColor);
      if (this.flashTimer) this.flashTimer.destroy();
      this.flashTimer = this.scene.time.delayedCall(500, () => {
        this.priceTxt.setColor('#e0e0e0');
      });
    }
  }

  onClick(callback: () => void): void {
    this.bg.on('pointerup', callback);
  }
}
