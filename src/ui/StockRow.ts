import Phaser from 'phaser';
import { THEME } from './theme';

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
    this.bg = scene.add.rectangle(0, 0, width, ROW_H, THEME.colors.bgCard, 0.8)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.add(this.bg);

    // 推荐股标记
    const prefix = data.isRecommended ? '⭐ ' : '';

    // 股票名称
    const nameTxt = scene.add.text(12, ROW_H / 2, `${prefix}${data.name}`, {
      fontSize: '15px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
    }).setOrigin(0, 0.5);
    this.add(nameTxt);

    // 现价
    this.priceTxt = scene.add.text(width - 120, ROW_H / 2, `¥${data.price.toFixed(2)}`, {
      fontSize: '16px', color: THEME.colors.textPrimary, fontFamily: THEME.font.mono,
    }).setOrigin(1, 0.5);
    this.add(this.priceTxt);

    // 涨跌幅
    const changeColor = data.changePercent >= 0 ? THEME.colors.rise : THEME.colors.fall;
    const changeSign = data.changePercent >= 0 ? '+' : '';
    this.changeTxt = scene.add.text(width - 12, ROW_H / 2,
      `${changeSign}${data.changePercent.toFixed(2)}%`, {
      fontSize: '15px', color: changeColor, fontFamily: THEME.font.mono,
    }).setOrigin(1, 0.5);
    this.add(this.changeTxt);

    // 分隔线
    const line = scene.add.rectangle(0, ROW_H - 1, width, 1, THEME.colors.border, 0.5).setOrigin(0, 0);
    this.add(line);
  }

  /** 更新价格和涨跌幅，触发增强闪烁 */
  updatePrice(newPrice: number, changePercent: number): void {
    const oldPrice = parseFloat(this.priceTxt.text.replace('¥', ''));
    this.priceTxt.setText(`¥${newPrice.toFixed(2)}`);

    const changeColor = changePercent >= 0 ? THEME.colors.rise : THEME.colors.fall;
    const changeSign = changePercent >= 0 ? '+' : '';
    this.changeTxt.setText(`${changeSign}${changePercent.toFixed(2)}%`);
    this.changeTxt.setColor(changeColor);

    if (newPrice !== oldPrice) {
      // 价格文字闪烁
      const flashColor = newPrice > oldPrice ? THEME.colors.rise : THEME.colors.fall;
      this.priceTxt.setColor(flashColor);

      // 背景微闪
      const flashBgColor = newPrice > oldPrice ? THEME.colors.riseBg : THEME.colors.fallBg;
      this.bg.setFillStyle(flashBgColor, 0.6);

      // 缩放弹跳
      this.scene.tweens.add({
        targets: this.priceTxt,
        scale: 1.15,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      if (this.flashTimer) this.flashTimer.destroy();
      this.flashTimer = this.scene.time.delayedCall(600, () => {
        this.priceTxt.setColor(THEME.colors.textPrimary);
        this.priceTxt.setScale(1);
        this.bg.setFillStyle(THEME.colors.bgCard, 0.8);
      });
    }
  }

  onClick(callback: () => void): void {
    this.bg.on('pointerup', callback);
  }
}
