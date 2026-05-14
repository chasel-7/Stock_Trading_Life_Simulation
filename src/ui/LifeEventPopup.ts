import Phaser from 'phaser';
import type { LifeEvent } from '../data/lifeEvents';
import { LifeEventManager } from '../managers/LifeEventManager';

export interface LifeEventPopupResult {
  eventId: string;
  cost: number;
  choice?: 'A' | 'B';
}

export class LifeEventPopup extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    width: number, height: number,
    event: LifeEvent,
    currentCash: number,
    dailyLoss: number,
    onDone: (result: LifeEventPopupResult) => void,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);

    // 遮罩
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0).setInteractive();
    this.add(overlay);

    // 卡片
    const cardW = width - 48;
    const cardH = event.type === 'choice' ? 320 : 220;
    const cx = width / 2;
    const cy = height / 2;

    const bg = scene.add.rectangle(cx, cy, cardW, cardH, 0x1e1e3a, 1)
      .setStrokeStyle(2, 0xe74c3c, 0.8);
    this.add(bg);

    // Emoji + 标题
    this.add(scene.add.text(cx, cy - cardH / 2 + 24, `⚡ 突发事件`, {
      fontSize: '13px', color: '#e74c3c', fontFamily: 'sans-serif',
    }).setOrigin(0.5));

    this.add(scene.add.text(cx, cy - cardH / 2 + 56, event.emoji, {
      fontSize: '40px',
    }).setOrigin(0.5));

    this.add(scene.add.text(cx, cy - cardH / 2 + 100, event.description, {
      fontSize: '16px', color: '#e0e0e0', fontFamily: 'sans-serif',
      wordWrap: { width: cardW - 32 },
      align: 'center',
    }).setOrigin(0.5, 0));

    if (event.type === 'forced') {
      const cost = LifeEventManager.calculateCost(event, currentCash, dailyLoss);
      const costLabel = cost > 0 ? `-¥${cost}` : cost === 0 ? '无花费' : `+¥${Math.abs(cost)}`;
      const costColor = cost > 0 ? '#e74c3c' : '#2ecc71';

      this.add(scene.add.text(cx, cy + 20, costLabel, {
        fontSize: '24px', color: costColor, fontFamily: 'monospace',
      }).setOrigin(0.5));

      // 特殊效果提示
      if (event.specialEffect) {
        const effectLabel = event.specialEffect === 'reduce-trading-ticks' ? '⏰ 明天盘中时间减半' :
                           event.specialEffect === 'skip-post-market' ? '🚫 明天无盘后社交' :
                           event.specialEffect === 'double-salary' ? '💰 明天双倍日薪' : '';
        if (effectLabel) {
          this.add(scene.add.text(cx, cy + 52, effectLabel, {
            fontSize: '13px', color: '#f39c12', fontFamily: 'sans-serif',
          }).setOrigin(0.5));
        }
      }

      const okBtn = scene.add.rectangle(cx, cy + cardH / 2 - 36, 160, 40, 0x555555, 1)
        .setInteractive({ useHandCursor: true });
      this.add(okBtn);
      this.add(scene.add.text(cx, cy + cardH / 2 - 36, '😩 认了', {
        fontSize: '15px', color: '#fff', fontFamily: 'sans-serif',
      }).setOrigin(0.5));
      okBtn.on('pointerup', () => {
        onDone({ eventId: event.id, cost });
        this.destroy();
      });
    } else if (event.type === 'choice' && event.optionA && event.optionB) {
      const costA = LifeEventManager.calculateOptionACost(event, currentCash);
      const btnY = cy + 40;

      // 选项A
      const btnA = scene.add.rectangle(cx - cardW / 4, btnY, cardW / 2 - 12, 60, 0x2d5a3d, 0.8)
        .setStrokeStyle(1, 0x27ae60)
        .setInteractive({ useHandCursor: true });
      this.add(btnA);
      this.add(scene.add.text(cx - cardW / 4, btnY - 10, event.optionA.label, {
        fontSize: '13px', color: '#e0e0e0', fontFamily: 'sans-serif',
        wordWrap: { width: cardW / 2 - 24 }, align: 'center',
      }).setOrigin(0.5));
      if (costA > 0) {
        this.add(scene.add.text(cx - cardW / 4, btnY + 18, `-¥${costA}`, {
          fontSize: '12px', color: '#e74c3c', fontFamily: 'monospace',
        }).setOrigin(0.5));
      }
      btnA.on('pointerup', () => {
        onDone({ eventId: event.id, cost: costA, choice: 'A' });
        this.destroy();
      });

      // 选项B
      const costB = typeof event.optionB.cost === 'number' ? event.optionB.cost : 0;
      const btnB = scene.add.rectangle(cx + cardW / 4, btnY, cardW / 2 - 12, 60, 0x5a2d2d, 0.8)
        .setStrokeStyle(1, 0xe74c3c)
        .setInteractive({ useHandCursor: true });
      this.add(btnB);
      this.add(scene.add.text(cx + cardW / 4, btnY - 10, event.optionB.label, {
        fontSize: '13px', color: '#e0e0e0', fontFamily: 'sans-serif',
        wordWrap: { width: cardW / 2 - 24 }, align: 'center',
      }).setOrigin(0.5));
      this.add(scene.add.text(cx + cardW / 4, btnY + 18, event.optionB.effect, {
        fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
      }).setOrigin(0.5));
      btnB.on('pointerup', () => {
        onDone({ eventId: event.id, cost: costB, choice: 'B' });
        this.destroy();
      });
    }

    // 入场动画
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 300 });
  }
}
