import Phaser from 'phaser';
import type { Holding } from '../models/types';

export class HoldingsPanel extends Phaser.GameObjects.Container {
  private totalPnlTxt: Phaser.GameObjects.Text;
  private rowsContainer: Phaser.GameObjects.Container;
  private panelWidth: number;
  private emptyTxt: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, _height: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.panelWidth = width;

    // 顶部总盈亏
    const topBg = scene.add.rectangle(0, 0, width, 80, 0x16213e, 1).setOrigin(0, 0);
    this.add(topBg);

    const label = scene.add.text(width / 2, 20, '今日总盈亏', {
      fontSize: '13px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.add(label);

    this.totalPnlTxt = scene.add.text(width / 2, 52, '¥0.00', {
      fontSize: '28px', color: '#e0e0e0', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(this.totalPnlTxt);

    // 列表区域
    this.rowsContainer = scene.add.container(0, 90);
    this.add(this.rowsContainer);

    this.emptyTxt = scene.add.text(width / 2, 140, '暂无持仓', {
      fontSize: '16px', color: '#555', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    this.add(this.emptyTxt);
  }

  /** 刷新持仓列表 */
  refresh(holdings: Holding[], currentPrices: Record<string, number>): void {
    this.rowsContainer.removeAll(true);

    if (holdings.length === 0) {
      this.emptyTxt.setVisible(true);
      this.totalPnlTxt.setText('¥0.00');
      this.totalPnlTxt.setColor('#e0e0e0');
      return;
    }
    this.emptyTxt.setVisible(false);

    let totalPnl = 0;
    const ROW_H = 64;

    holdings.forEach((h, i) => {
      const price = currentPrices[h.stockId] || 0;
      const marketValue = h.shares * price;
      const pnl = marketValue - h.costBasis;
      const pnlPercent = h.costBasis > 0 ? (pnl / h.costBasis) * 100 : 0;
      totalPnl += pnl;

      const color = pnl >= 0 ? '#e74c3c' : '#2ecc71';
      const sign = pnl >= 0 ? '+' : '';

      // 股票名
      const name = this.scene.add.text(12, i * ROW_H + ROW_H / 2 - 10, h.stockId, {
        fontSize: '15px', color: '#e0e0e0', fontFamily: 'sans-serif',
      });
      this.rowsContainer.add(name);

      // 市值
      const val = this.scene.add.text(12, i * ROW_H + ROW_H / 2 + 10,
        `市值 ¥${marketValue.toFixed(0)}`, {
        fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
      });
      this.rowsContainer.add(val);

      // 盈亏
      const pnlTxt = this.scene.add.text(this.panelWidth - 12, i * ROW_H + ROW_H / 2 - 10,
        `${sign}¥${pnl.toFixed(0)}`, {
        fontSize: '15px', color, fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      this.rowsContainer.add(pnlTxt);

      const pctTxt = this.scene.add.text(this.panelWidth - 12, i * ROW_H + ROW_H / 2 + 10,
        `${sign}${pnlPercent.toFixed(2)}%`, {
        fontSize: '12px', color, fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      this.rowsContainer.add(pctTxt);

      // 分隔线
      const line = this.scene.add.rectangle(0, (i + 1) * ROW_H, this.panelWidth, 1, 0x333366, 0.5)
        .setOrigin(0, 0);
      this.rowsContainer.add(line);
    });

    // 更新总盈亏
    const totalColor = totalPnl >= 0 ? '#e74c3c' : '#2ecc71';
    const totalSign = totalPnl >= 0 ? '+' : '';
    this.totalPnlTxt.setText(`${totalSign}¥${totalPnl.toFixed(2)}`);
    this.totalPnlTxt.setColor(totalColor);
  }
}
