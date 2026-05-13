import Phaser from 'phaser';
import type { DailyStockData } from '../models/types';

export class CandlestickChart extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private chartWidth: number;
  private chartHeight: number;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.chartWidth = width;
    this.chartHeight = height;

    const bg = scene.add.rectangle(0, 0, width, height, 0x0d1117, 1).setOrigin(0, 0);
    this.add(bg);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
  }

  /** 绘制K线（传入已完成的天数据） */
  draw(dailyData: DailyStockData[], currentDay: number): void {
    this.graphics.clear();

    // 清除旧标签
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels = [];

    const days = dailyData.slice(0, currentDay);
    if (days.length === 0) return;

    const padding = 20;
    const w = this.chartWidth - padding * 2;
    const h = this.chartHeight - padding * 2;

    // 价格范围
    let maxP = -Infinity, minP = Infinity;
    for (const d of days) {
      maxP = Math.max(maxP, d.high);
      minP = Math.min(minP, d.low);
    }
    maxP *= 1.01;
    minP *= 0.99;
    const range = maxP - minP || 1;

    const toY = (p: number) => padding + h - ((p - minP) / range) * h;
    const candleW = Math.min(w / days.length * 0.7, 16);
    const gap = w / days.length;

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const cx = padding + gap * i + gap / 2;
      const isUp = d.close >= d.open;
      const color = isUp ? 0xe74c3c : 0x2ecc71;

      // 上下影线
      this.graphics.lineStyle(1, color, 1);
      this.graphics.lineBetween(cx, toY(d.high), cx, toY(d.low));

      // 实体
      const bodyTop = toY(Math.max(d.open, d.close));
      const bodyBot = toY(Math.min(d.open, d.close));
      const bodyH = Math.max(bodyBot - bodyTop, 1);

      if (isUp) {
        // 阳线：空心（描边）
        this.graphics.lineStyle(1, color, 1);
        this.graphics.strokeRect(cx - candleW / 2, bodyTop, candleW, bodyH);
      } else {
        // 阴线：实心
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(cx - candleW / 2, bodyTop, candleW, bodyH);
      }
    }

    // 价格刻度标签
    const highTxt = this.scene.add.text(this.chartWidth - 4, padding, maxP.toFixed(2), {
      fontSize: '10px', color: '#888', fontFamily: 'monospace',
    }).setOrigin(1, 0);
    this.add(highTxt);
    this.labels.push(highTxt);

    const lowTxt = this.scene.add.text(this.chartWidth - 4, padding + h, minP.toFixed(2), {
      fontSize: '10px', color: '#888', fontFamily: 'monospace',
    }).setOrigin(1, 1);
    this.add(lowTxt);
    this.labels.push(lowTxt);
  }
}
