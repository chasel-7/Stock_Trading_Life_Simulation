import Phaser from 'phaser';

export class TimelineChart extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private chartWidth: number;
  private chartHeight: number;
  private prices: number[] = [];
  private lastDrawnLength = 0;
  private openPrice = 0;
  private priceLabelHigh: Phaser.GameObjects.Text;
  private priceLabelLow: Phaser.GameObjects.Text;
  private priceLabelOpen: Phaser.GameObjects.Text;
  private currentPriceTxt: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.chartWidth = width;
    this.chartHeight = height;

    // 背景
    const bg = scene.add.rectangle(0, 0, width, height, 0x0d1117, 1).setOrigin(0, 0);
    this.add(bg);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // 价格标签
    this.priceLabelHigh = scene.add.text(width - 4, 4, '', {
      fontSize: '11px', color: '#e74c3c', fontFamily: 'monospace',
    }).setOrigin(1, 0);
    this.add(this.priceLabelHigh);

    this.priceLabelLow = scene.add.text(width - 4, height - 4, '', {
      fontSize: '11px', color: '#2ecc71', fontFamily: 'monospace',
    }).setOrigin(1, 1);
    this.add(this.priceLabelLow);

    this.priceLabelOpen = scene.add.text(4, 4, '', {
      fontSize: '11px', color: '#888', fontFamily: 'monospace',
    });
    this.add(this.priceLabelOpen);

    this.currentPriceTxt = scene.add.text(width / 2, height - 4, '', {
      fontSize: '13px', color: '#fff', fontFamily: 'monospace',
    }).setOrigin(0.5, 1);
    this.add(this.currentPriceTxt);
  }

  /** 初始化（新的一天） */
  init(openPrice: number): void {
    this.openPrice = openPrice;
    this.prices = [];
    this.redraw();
  }

  /** 添加一个tick价格并重绘（仅在数据变化时） */
  addTick(price: number): void {
    this.prices.push(price);
    if (this.prices.length !== this.lastDrawnLength) {
      this.redraw();
      this.lastDrawnLength = this.prices.length;
    }
  }

  private redraw(): void {
    this.graphics.clear();
    if (this.prices.length === 0) return;

    const padding = 20;
    const w = this.chartWidth - padding * 2;
    const h = this.chartHeight - padding * 2;

    const allPrices = [this.openPrice, ...this.prices];
    const maxP = Math.max(...allPrices) * 1.002;
    const minP = Math.min(...allPrices) * 0.998;
    const range = maxP - minP || 1;

    const toY = (p: number) => padding + h - ((p - minP) / range) * h;
    const toX = (i: number) => padding + (i / Math.max(this.prices.length - 1, 1)) * w;

    // 开盘价基准线（虚线效果）
    const openY = toY(this.openPrice);
    this.graphics.lineStyle(1, 0x555555, 0.6);
    for (let x = padding; x < this.chartWidth - padding; x += 8) {
      this.graphics.lineBetween(x, openY, Math.min(x + 4, this.chartWidth - padding), openY);
    }

    // 分时线
    const lastPrice = this.prices[this.prices.length - 1];
    const lineColor = lastPrice >= this.openPrice ? 0xe74c3c : 0x2ecc71;
    this.graphics.lineStyle(2, lineColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(toX(0), toY(this.prices[0]));
    for (let i = 1; i < this.prices.length; i++) {
      this.graphics.lineTo(toX(i), toY(this.prices[i]));
    }
    this.graphics.strokePath();

    // 面积填充
    const fillColor = lastPrice >= this.openPrice ? 0xe74c3c : 0x2ecc71;
    this.graphics.fillStyle(fillColor, 0.1);
    this.graphics.beginPath();
    this.graphics.moveTo(toX(0), toY(this.prices[0]));
    for (let i = 1; i < this.prices.length; i++) {
      this.graphics.lineTo(toX(i), toY(this.prices[i]));
    }
    this.graphics.lineTo(toX(this.prices.length - 1), toY(this.openPrice));
    this.graphics.lineTo(toX(0), toY(this.openPrice));
    this.graphics.closePath();
    this.graphics.fillPath();

    // 更新标签
    this.priceLabelHigh.setText(maxP.toFixed(2));
    this.priceLabelLow.setText(minP.toFixed(2));
    this.priceLabelOpen.setText(`开: ${this.openPrice.toFixed(2)}`);
    this.currentPriceTxt.setText(`¥${lastPrice.toFixed(2)}`);
    this.currentPriceTxt.setColor(lastPrice >= this.openPrice ? '#e74c3c' : '#2ecc71');
  }
}
