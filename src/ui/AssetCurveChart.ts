import Phaser from 'phaser';
import type { DailySnapshot } from '../models/types';

export class AssetCurveChart extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    snapshots: DailySnapshot[],
    startingCash: number,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const bg = scene.add.rectangle(0, 0, width, height, 0x0d1117, 1).setOrigin(0, 0);
    this.add(bg);

    if (snapshots.length === 0) return;

    const g = scene.add.graphics();
    this.add(g);

    const pad = 30;
    const w = width - pad * 2;
    const h = height - pad * 2;

    const values = snapshots.map(s => s.totalAssets);
    const allValues = [startingCash, ...values];
    const maxV = Math.max(...allValues) * 1.05;
    const minV = Math.min(...allValues) * 0.95;
    const range = maxV - minV || 1;

    const toX = (i: number) => pad + (i / Math.max(snapshots.length, 1)) * w;
    const toY = (v: number) => pad + h - ((v - minV) / range) * h;

    // 起始线
    const startY = toY(startingCash);
    g.lineStyle(1, 0x555555, 0.5);
    for (let px = pad; px < width - pad; px += 6) {
      g.lineBetween(px, startY, Math.min(px + 3, width - pad), startY);
    }

    // 目标线 (200%)
    const targetY = toY(startingCash * 2);
    if (targetY > pad) {
      g.lineStyle(1, 0xffd700, 0.3);
      for (let px = pad; px < width - pad; px += 6) {
        g.lineBetween(px, targetY, Math.min(px + 3, width - pad), targetY);
      }
      this.add(scene.add.text(width - pad, targetY - 12, '🏆 目标', {
        fontSize: '10px', color: '#ffd700', fontFamily: 'sans-serif',
      }).setOrigin(1, 1));
    }

    // 资产曲线 - 渐变效果
    g.lineStyle(2, 0x4a90d9, 1);
    g.beginPath();
    g.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < values.length; i++) {
      g.lineTo(toX(i), toY(values[i]));
    }
    g.strokePath();

    // 填充区域
    g.fillStyle(0x4a90d9, 0.1);
    g.beginPath();
    g.moveTo(toX(0), toY(values[0]));
    for (let i = 1; i < values.length; i++) {
      g.lineTo(toX(i), toY(values[i]));
    }
    g.lineTo(toX(values.length - 1), pad + h);
    g.lineTo(toX(0), pad + h);
    g.closePath();
    g.fillPath();

    // 数据点
    values.forEach((v, i) => {
      const color = v >= startingCash ? 0xe74c3c : 0x2ecc71;
      g.fillStyle(color, 1);
      g.fillCircle(toX(i), toY(v), 4);
    });

    // Y轴标签
    this.add(scene.add.text(pad, pad - 12, `¥${maxV.toFixed(0)}`, {
      fontSize: '10px', color: '#888', fontFamily: 'monospace',
    }));
    this.add(scene.add.text(pad, pad + h + 4, `¥${minV.toFixed(0)}`, {
      fontSize: '10px', color: '#888', fontFamily: 'monospace',
    }));
    this.add(scene.add.text(width / 2, height - 4, '资产变化曲线', {
      fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5, 1));

    // X轴：首尾日期
    this.add(scene.add.text(pad, pad + h + 16, `Day 1`, {
      fontSize: '9px', color: '#666', fontFamily: 'monospace',
    }));
    this.add(scene.add.text(width - pad, pad + h + 16, `Day ${snapshots.length}`, {
      fontSize: '9px', color: '#666', fontFamily: 'monospace',
    }).setOrigin(1, 0));
  }
}
