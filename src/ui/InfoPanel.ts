import Phaser from 'phaser';
import type { InfoItem } from '../models/types';

export class InfoPanel extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    infoList: InfoItem[],
    chainedStocks: string[],
    onClose: () => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    // 背景
    const bg = scene.add.rectangle(0, 0, width, height, 0x1a1a2e, 0.98).setOrigin(0, 0);
    this.add(bg);

    // 标题
    this.add(scene.add.text(width / 2, 20, '📋 情报收集', {
      fontSize: '18px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5));

    // 关闭按钮
    const closeBtn = scene.add.text(width - 16, 16, '✕', {
      fontSize: '20px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerup', onClose);
    this.add(closeBtn);

    if (infoList.length === 0) {
      this.add(scene.add.text(width / 2, height / 2, '暂无情报\n通过盘后场景获取', {
        fontSize: '16px', color: '#555', fontFamily: 'sans-serif',
        align: 'center',
      }).setOrigin(0.5));
      return;
    }

    // 按股票分组
    const grouped: Record<string, InfoItem[]> = {};
    for (const info of infoList) {
      if (!grouped[info.stockId]) grouped[info.stockId] = [];
      grouped[info.stockId].push(info);
    }

    let rowY = 56;
    for (const [stockId, items] of Object.entries(grouped)) {
      const isChained = chainedStocks.includes(stockId);
      const headerColor = isChained ? '#ffd700' : '#4a90d9';
      const chainLabel = isChained ? ' 🔗 已串联' : '';

      this.add(scene.add.text(16, rowY, `${stockId}${chainLabel}`, {
        fontSize: '15px', color: headerColor, fontFamily: 'sans-serif',
      }));
      rowY += 24;

      for (const info of items) {
        const accColor = info.accuracy >= 0.7 ? '#2ecc71' :
                         info.accuracy >= 0.5 ? '#f39c12' : '#e74c3c';
        this.add(scene.add.text(28, rowY, `Day${info.day} [${info.source}]`, {
          fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
        }));
        this.add(scene.add.text(width - 16, rowY, `${Math.round(info.accuracy * 100)}%`, {
          fontSize: '11px', color: accColor, fontFamily: 'monospace',
        }).setOrigin(1, 0));
        rowY += 18;

        this.add(scene.add.text(28, rowY, info.content, {
          fontSize: '13px', color: '#ccc', fontFamily: 'sans-serif',
          wordWrap: { width: width - 56 },
        }));
        rowY += 24;
      }
      rowY += 8;
    }
  }
}
