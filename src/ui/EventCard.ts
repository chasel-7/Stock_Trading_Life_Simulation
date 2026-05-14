import Phaser from 'phaser';
import { THEME } from './theme';
import type { SceneEvent, EventOption, EventResult } from '../models/sceneTypes';

export class EventCard extends Phaser.GameObjects.Container {
  private onComplete: (result: EventResult) => void;
  private event: SceneEvent;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number,
    event: SceneEvent,
    onComplete: (result: EventResult) => void,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.event = event;
    this.onComplete = onComplete;

    const cardH = 280;

    // 卡片背景 — 圆角
    const bg = scene.add.graphics();
    bg.fillStyle(THEME.colors.bgCard, 0.95);
    bg.fillRoundedRect(-width / 2, 0, width, cardH, THEME.radius);
    bg.lineStyle(1, THEME.colors.borderActive, 0.5);
    bg.strokeRoundedRect(-width / 2, 0, width, cardH, THEME.radius);
    this.add(bg);

    // 事件emoji + 描述
    const emojiText = scene.add.text(0, 20, event.emoji, {
      fontSize: '36px',
    }).setOrigin(0.5);
    this.add(emojiText);

    const desc = scene.add.text(0, 68, event.description, {
      fontSize: '15px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      wordWrap: { width: width - 40 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.add(desc);

    // 选项A
    const optAY = 140;
    this.createOptionButton(scene, -width / 4, optAY, width / 2 - 12, event.optionA, 'A');

    // 选项B
    this.createOptionButton(scene, width / 4, optAY, width / 2 - 12, event.optionB, 'B');

    // 增强入场动画
    this.setAlpha(0);
    this.setScale(0.85);
    this.y += 20;
    scene.tweens.add({
      targets: this,
      alpha: 1, scale: 1, y: this.y - 20,
      duration: 400,
      ease: 'Back.easeOut',
    });
  }

  private createOptionButton(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number,
    option: EventOption,
    choice: 'A' | 'B',
  ): void {
    const btnH = 100;
    const color = choice === 'A' ? 0x2d5a3d : 0x5a2d2d;
    const borderColor = choice === 'A' ? 0x27ae60 : 0xe74c3c;

    const btnBg = scene.add.rectangle(x, y, width, btnH, color, 0.8)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, borderColor, 0.6)
      .setInteractive({ useHandCursor: true });
    this.add(btnBg);

    // 选项文本
    const label = scene.add.text(x, y + 12, option.label, {
      fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      wordWrap: { width: width - 16 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.add(label);

    // 花费提示
    if (option.cost > 0) {
      const costTxt = scene.add.text(x, y + btnH - 16, `-¥${option.cost}`, {
        fontSize: '12px', color: THEME.colors.rise, fontFamily: THEME.font.mono,
      }).setOrigin(0.5, 1);
      this.add(costTxt);
    }

    // 信息奖励提示
    if (option.infoReward) {
      const infoTxt = scene.add.text(x, y + btnH - 32, '📋 可获信息', {
        fontSize: '11px', color: '#6c5ce7', fontFamily: THEME.font.primary,
      }).setOrigin(0.5, 1);
      this.add(infoTxt);
    }

    btnBg.on('pointerup', () => this.choose(choice, option));

    // Hover效果
    btnBg.on('pointerover', () => btnBg.setStrokeStyle(2, borderColor, 1));
    btnBg.on('pointerout', () => btnBg.setStrokeStyle(1, borderColor, 0.6));
  }

  private choose(choice: 'A' | 'B', option: EventOption): void {
    const result: EventResult = {
      eventId: this.event.id,
      chosenOption: choice,
      cost: option.cost,
      gotInfo: option.infoReward,
      infoAccuracy: option.infoAccuracy,
      message: option.specialEffect || option.infoContent || '无事发生',
    };

    // 退场动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 30,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        this.onComplete(result);
        this.destroy();
      },
    });
  }
}
