import Phaser from 'phaser';
import type { ScoreResult } from '../utils/scoring';

export class RadarChart extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene, x: number, y: number,
    radius: number, scores: ScoreResult,
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    const g = scene.add.graphics();
    this.add(g);

    const dims = [
      { label: '投资智慧', value: scores.investWisdom, angle: -Math.PI / 2 },
      { label: '社交回报', value: scores.socialReturn, angle: 0 },
      { label: '生活平衡', value: scores.lifeBalance, angle: Math.PI / 2 },
      { label: '心态稳定', value: scores.mentalStability, angle: Math.PI },
    ];

    // 背景网格 (3层)
    for (const level of [0.33, 0.66, 1.0]) {
      g.lineStyle(1, 0x333366, 0.4);
      g.beginPath();
      dims.forEach((d, i) => {
        const r = radius * level;
        const px = Math.cos(d.angle) * r;
        const py = Math.sin(d.angle) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      });
      g.closePath();
      g.strokePath();
    }

    // 轴线
    g.lineStyle(1, 0x333366, 0.3);
    dims.forEach(d => {
      g.lineBetween(0, 0, Math.cos(d.angle) * radius, Math.sin(d.angle) * radius);
    });

    // 数据区域
    g.fillStyle(0x4a90d9, 0.2);
    g.lineStyle(2, 0x4a90d9, 0.8);
    g.beginPath();
    dims.forEach((d, i) => {
      const r = (d.value / 100) * radius;
      const px = Math.cos(d.angle) * r;
      const py = Math.sin(d.angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
    g.closePath();
    g.fillPath();
    g.strokePath();

    // 数据点
    dims.forEach(d => {
      const r = (d.value / 100) * radius;
      const px = Math.cos(d.angle) * r;
      const py = Math.sin(d.angle) * r;
      g.fillStyle(0x4a90d9, 1);
      g.fillCircle(px, py, 5);
    });

    // 标签
    dims.forEach(d => {
      const labelR = radius + 24;
      const lx = Math.cos(d.angle) * labelR;
      const ly = Math.sin(d.angle) * labelR;
      const txt = scene.add.text(lx, ly, `${d.label}\n${d.value}`, {
        fontSize: '12px', color: '#ccc', fontFamily: 'sans-serif',
        align: 'center',
      }).setOrigin(0.5);
      this.add(txt);
    });
  }
}
