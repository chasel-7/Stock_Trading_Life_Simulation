import Phaser from 'phaser';
import { StockRow } from './StockRow';
import type { StockRowData } from './StockRow';

export class StockListPanel extends Phaser.GameObjects.Container {
  private rows: Map<string, StockRow> = new Map();
  private listContainer: Phaser.GameObjects.Container;
  private maskShape: Phaser.GameObjects.Graphics;
  private contentHeight = 0;
  private scrollY = 0;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    stocks: StockRowData[],
    onStockClick: (stockId: string) => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    // 标题栏
    const header = scene.add.rectangle(0, 0, width, 36, 0x16213e, 1).setOrigin(0, 0);
    this.add(header);
    const hdrTxt = scene.add.text(12, 18, '股票名称', {
      fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0, 0.5);
    this.add(hdrTxt);
    const hdrPrice = scene.add.text(width - 120, 18, '现价', {
      fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(1, 0.5);
    this.add(hdrPrice);
    const hdrChange = scene.add.text(width - 12, 18, '涨跌幅', {
      fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(1, 0.5);
    this.add(hdrChange);

    // 列表容器
    this.listContainer = scene.add.container(0, 36);
    this.add(this.listContainer);

    const ROW_H = 56;
    stocks.forEach((data, i) => {
      const row = new StockRow(scene, 0, i * ROW_H, width, data);
      row.onClick(() => onStockClick(data.stockId));
      this.listContainer.add(row);
      this.rows.set(data.stockId, row);
    });
    this.contentHeight = stocks.length * ROW_H;

    // 遮罩
    this.maskShape = scene.add.graphics();
    this.maskShape.fillRect(x, y + 36, width, height - 36);
    const mask = this.maskShape.createGeometryMask();
    this.listContainer.setMask(mask);

    // 触摸滚动
    this.setSize(width, height);
    this.setInteractive();
    let dragStartY = 0;
    let scrollStart = 0;
    this.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragStartY = p.y;
      scrollStart = this.scrollY;
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const dy = p.y - dragStartY;
      const maxScroll = Math.max(0, this.contentHeight - (height - 36));
      this.scrollY = Phaser.Math.Clamp(scrollStart - dy, 0, maxScroll);
      this.listContainer.y = 36 - this.scrollY;
    });
  }

  updateStockPrice(stockId: string, price: number, changePercent: number): void {
    const row = this.rows.get(stockId);
    if (row) row.updatePrice(price, changePercent);
  }
}
