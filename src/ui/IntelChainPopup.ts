import Phaser from 'phaser';
import { THEME } from './theme';
import { CardFactory } from './CardFactory';
import type { ChainVerdict } from '../managers/InfoManager';

export class IntelChainPopup extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    verdict: ChainVerdict,
    onDismiss: () => void,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(900);

    // 半透明遮罩
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0).setInteractive();
    this.add(overlay);

    // 弹窗卡片
    const cardW = width - 48;
    const cardH = 320;
    const cardX = 24;
    const cardY = (height - cardH) / 2;

    // 卡片背景（金色边框突显重要性）
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    bg.lineStyle(2, 0xffd700, 0.8);
    bg.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);
    this.add(bg);

    // 顶部标题
    const titleY = cardY + 28;
    this.add(scene.add.text(width / 2, titleY, '🔗 情报串联触发！', {
      fontSize: '20px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5));

    // 股票ID
    this.add(scene.add.text(width / 2, titleY + 32, verdict.stockId, {
      fontSize: '18px', color: '#4a90d9', fontFamily: THEME.font.mono,
    }).setOrigin(0.5));

    // 确信度
    const accPercent = Math.round(verdict.combinedAccuracy * 100);
    this.add(scene.add.text(width / 2, titleY + 58, `综合确信度: ${accPercent}%`, {
      fontSize: '14px', color: '#2ecc71', fontFamily: THEME.font.mono,
    }).setOrigin(0.5));

    // 来源标签
    const sourcesStr = verdict.sources.map(s => `「${s}」`).join(' + ');
    this.add(scene.add.text(width / 2, titleY + 82, sourcesStr, {
      fontSize: '11px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      wordWrap: { width: cardW - 32 }, align: 'center',
    }).setOrigin(0.5));

    // 分隔线
    const dividerY = titleY + 106;
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0xffd700, 0.3);
    divider.lineBetween(cardX + 20, dividerY, cardX + cardW - 20, dividerY);
    this.add(divider);

    // 综合研判
    this.add(scene.add.text(cardX + 20, dividerY + 16, '📋 综合研判', {
      fontSize: '13px', color: '#ffd700', fontFamily: THEME.font.primary,
    }));
    this.add(scene.add.text(cardX + 20, dividerY + 40, verdict.verdict, {
      fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      wordWrap: { width: cardW - 40 },
    }));

    // 信息明细（最多显示3条）
    let detailY = dividerY + 76;
    const maxDetails = Math.min(verdict.details.length, 3);
    for (let i = 0; i < maxDetails; i++) {
      this.add(scene.add.text(cardX + 20, detailY, `• ${verdict.details[i]}`, {
        fontSize: '11px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
        wordWrap: { width: cardW - 40 },
      }));
      detailY += 22;
    }

    // 确认按钮
    const btnY = cardY + cardH - 36;
    const dismissBtn = CardFactory.createButton(
      scene, width / 2, btnY, 160, 40,
      '✅ 知道了', {
        color: 0xffd700,
        onClick: () => {
          this.destroy();
          onDismiss();
        },
      },
    );
    this.add(dismissBtn);

    // 入场动画
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 300, ease: 'Power2' });
  }
}
