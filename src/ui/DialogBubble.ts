import Phaser from 'phaser';
import { THEME } from './theme';

export interface DialogBubbleConfig {
  npcName: string;
  npcEmoji: string;
  message: string;
  onDismiss: () => void;
  onSkip?: () => void;
  highlightArea?: { x: number; y: number; w: number; h: number };
}

export class DialogBubble {
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private highlight?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, config: DialogBubbleConfig) {
    const { width, height } = scene.scale;

    // 半透明遮罩
    this.overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.5)
      .setOrigin(0, 0).setDepth(998).setInteractive();

    // 高亮区域（如果有）
    if (config.highlightArea) {
      const { x, y, w, h } = config.highlightArea;
      this.highlight = scene.add.rectangle(x + w / 2, y + h / 2, w, h)
        .setDepth(999)
        .setStrokeStyle(2, 0xffd700, 1)
        .setFillStyle(0x000000, 0);
    }

    // 对话框
    this.container = scene.add.container(0, height - 200).setDepth(1000);

    const bubbleBg = scene.add.graphics();
    bubbleBg.fillStyle(THEME.colors.bgSecondary, 0.95);
    bubbleBg.fillRoundedRect(16, 0, width - 32, 160, 12);
    bubbleBg.lineStyle(1, 0x4a90d9, 0.8);
    bubbleBg.strokeRoundedRect(16, 0, width - 32, 160, 12);
    this.container.add(bubbleBg);

    // NPC头像+名字
    this.container.add(scene.add.text(32, 12, `${config.npcEmoji} ${config.npcName}`, {
      fontSize: '15px', color: '#ffd700', fontFamily: THEME.font.primary,
    }));

    // 消息文本
    this.container.add(scene.add.text(32, 40, config.message, {
      fontSize: '13px', color: THEME.colors.textPrimary,
      fontFamily: THEME.font.primary,
      wordWrap: { width: width - 80 }, lineSpacing: 6,
    }));

    // 点击继续
    this.container.add(scene.add.text(width - 48, 132, '点击继续 →', {
      fontSize: '11px', color: '#888', fontFamily: THEME.font.primary,
    }).setOrigin(1, 0));

    // 跳过按钮
    const skipBtn = scene.add.text(48, 132, '跳过教学', {
      fontSize: '11px', color: '#666', fontFamily: THEME.font.primary,
    }).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerup', () => {
      this.destroy();
      if (config.onSkip) config.onSkip();
      else config.onDismiss();
    });
    this.container.add(skipBtn);

    // 点击遮罩继续
    this.overlay.on('pointerup', () => {
      this.destroy();
      config.onDismiss();
    });

    // 入场动画
    this.container.setAlpha(0);
    scene.tweens.add({ targets: this.container, alpha: 1, duration: 300 });
  }

  destroy(): void {
    this.overlay.destroy();
    this.container.destroy();
    if (this.highlight) this.highlight.destroy();
  }
}
