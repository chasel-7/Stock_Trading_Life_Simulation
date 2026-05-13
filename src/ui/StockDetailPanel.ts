import Phaser from 'phaser';
import { TimelineChart } from './TimelineChart';
import { CandlestickChart } from './CandlestickChart';
import type { DailyStockData } from '../models/types';

export class StockDetailPanel extends Phaser.GameObjects.Container {
  private timelineChart: TimelineChart;
  private candleChart: CandlestickChart;
  private stockNameTxt: Phaser.GameObjects.Text;
  private infoTxt: Phaser.GameObjects.Text;
  private onBuy: () => void = () => {};
  private onSell: () => void = () => {};
  private onBack: () => void = () => {};

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    // 背景
    const bg = scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 1).setOrigin(0, 0);
    this.add(bg);

    // 返回按钮
    const backBtn = scene.add.text(12, 16, '← 返回', {
      fontSize: '14px', color: '#4a90d9', fontFamily: 'sans-serif',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => this.onBack());
    this.add(backBtn);

    // 股票名
    this.stockNameTxt = scene.add.text(width / 2, 16, '', {
      fontSize: '18px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 0);
    this.add(this.stockNameTxt);

    // 关键指标
    this.infoTxt = scene.add.text(width / 2, 46, '', {
      fontSize: '12px', color: '#aaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    this.add(this.infoTxt);

    // 图表
    const chartY = 76;
    const chartH = 240;
    this.timelineChart = new TimelineChart(scene, 0, chartY, width, chartH);
    this.add(this.timelineChart);

    this.candleChart = new CandlestickChart(scene, 0, chartY, width, chartH);
    this.add(this.candleChart);
    this.candleChart.setVisible(false);

    // 图表切换按钮
    const switchY = chartY + chartH + 8;
    const tlBtn = scene.add.text(width / 2 - 60, switchY, '分时', {
      fontSize: '13px', color: '#4a90d9', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const klBtn = scene.add.text(width / 2 + 60, switchY, '日K', {
      fontSize: '13px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.add(tlBtn);
    this.add(klBtn);

    tlBtn.on('pointerup', () => {
      this.timelineChart.setVisible(true);
      this.candleChart.setVisible(false);
      tlBtn.setColor('#4a90d9');
      klBtn.setColor('#888');
    });
    klBtn.on('pointerup', () => {
      this.timelineChart.setVisible(false);
      this.candleChart.setVisible(true);
      tlBtn.setColor('#888');
      klBtn.setColor('#4a90d9');
    });

    // 买入/卖出按钮
    const btnY = height - 60;
    const buyBg = scene.add.rectangle(width / 4, btnY, width / 2 - 20, 44, 0x2ecc71, 0.9)
      .setInteractive({ useHandCursor: true });
    const buyTxt = scene.add.text(width / 4, btnY, '买入 🟢', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    buyBg.on('pointerup', () => this.onBuy());
    this.add(buyBg);
    this.add(buyTxt);

    const sellBg = scene.add.rectangle(width * 3 / 4, btnY, width / 2 - 20, 44, 0xe74c3c, 0.9)
      .setInteractive({ useHandCursor: true });
    const sellTxt = scene.add.text(width * 3 / 4, btnY, '卖出 🔴', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    sellBg.on('pointerup', () => this.onSell());
    this.add(sellBg);
    this.add(sellTxt);

    this.setVisible(false);
  }

  show(
    stockId: string,
    dailyData: DailyStockData[],
    currentDay: number,
    callbacks: { onBuy: () => void; onSell: () => void; onBack: () => void },
  ): void {
    this.stockNameTxt.setText(stockId);
    this.onBuy = callbacks.onBuy;
    this.onSell = callbacks.onSell;
    this.onBack = callbacks.onBack;

    const today = dailyData[currentDay];
    if (today) {
      this.infoTxt.setText(
        `今开:${today.open.toFixed(2)}  最高:${today.high.toFixed(2)}  最低:${today.low.toFixed(2)}`
      );
      this.timelineChart.init(today.open);
    }

    this.candleChart.draw(dailyData, currentDay);
    this.setVisible(true);
  }

  addTick(price: number): void {
    this.timelineChart.addTick(price);
  }

  hide(): void {
    this.setVisible(false);
  }
}
