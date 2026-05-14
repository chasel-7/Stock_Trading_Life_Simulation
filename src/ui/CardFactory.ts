import Phaser from 'phaser';
import { THEME } from './theme';

export class CardFactory {
  /** 创建圆角矩形卡片 */
  static create(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    options?: {
      fillColor?: number;
      fillAlpha?: number;
      strokeColor?: number;
      strokeWidth?: number;
      radius?: number;
      interactive?: boolean;
    },
  ): Phaser.GameObjects.Graphics {
    const {
      fillColor = THEME.colors.bgCard,
      fillAlpha = 1,
      strokeColor = THEME.colors.border,
      strokeWidth = 1,
      radius = THEME.radius,
      interactive = false,
    } = options || {};

    const g = scene.add.graphics();
    g.fillStyle(fillColor, fillAlpha);
    g.fillRoundedRect(x, y, width, height, radius);

    if (strokeWidth > 0) {
      g.lineStyle(strokeWidth, strokeColor, 0.6);
      g.strokeRoundedRect(x, y, width, height, radius);
    }

    if (interactive) {
      const hitArea = new Phaser.Geom.Rectangle(x, y, width, height);
      g.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    }

    return g;
  }

  /** 创建带标题的信息卡片 */
  static createInfoCard(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number,
    title: string,
    content: string,
    emoji?: string,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const cardH = 80;

    const bg = CardFactory.create(scene, 0, 0, width, cardH);
    container.add(bg);

    if (emoji) {
      container.add(scene.add.text(16, cardH / 2, emoji, {
        fontSize: '24px',
      }).setOrigin(0, 0.5));
    }

    const textX = emoji ? 52 : 16;
    container.add(scene.add.text(textX, 16, title, {
      fontSize: '13px', color: THEME.colors.textSecondary,
      fontFamily: THEME.font.primary,
    }));
    container.add(scene.add.text(textX, 40, content, {
      fontSize: '17px', color: THEME.colors.textPrimary,
      fontFamily: THEME.font.primary,
    }));

    return container;
  }

  /** 创建按钮 */
  static createButton(
    scene: Phaser.Scene,
    x: number, y: number,
    width: number, height: number,
    label: string,
    options?: {
      color?: number;
      textColor?: string;
      fontSize?: string;
      onClick?: () => void;
    },
  ): Phaser.GameObjects.Container {
    const {
      color = THEME.colors.accent,
      textColor = '#fff',
      fontSize = '16px',
      onClick,
    } = options || {};

    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    container.add(bg);

    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    bg.input!.cursor = 'pointer';

    const txt = scene.add.text(0, 0, label, {
      fontSize, color: textColor, fontFamily: THEME.font.primary,
    }).setOrigin(0.5);
    container.add(txt);

    // Hover 动画
    bg.on('pointerover', () => {
      scene.tweens.add({ targets: container, scale: 1.03, duration: 100 });
    });
    bg.on('pointerout', () => {
      scene.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    if (onClick) {
      bg.on('pointerup', onClick);
    }

    return container;
  }
}
