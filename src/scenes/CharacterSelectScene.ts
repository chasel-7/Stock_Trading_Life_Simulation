import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters';
import { getGameManager } from '../managers/GameManager';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private detailTexts: Phaser.GameObjects.Text[] = [];
  private cardBgs: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e, 1).setOrigin(0, 0);

    this.add.text(width / 2, 36, '👤 选择你的角色', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, 64, '每个角色是不同的资源约束和策略路线', {
      fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 角色卡片
    const startY = 96;
    const cardH = 88;
    const gap = 10;

    CHARACTER_ORDER.forEach((id, i) => {
      const char = CHARACTERS[id];
      const y = startY + i * (cardH + gap);

      const bg = this.add.rectangle(width / 2, y + cardH / 2, width - 40, cardH, 0x1e1e3a, 1)
        .setStrokeStyle(1, 0x333366)
        .setInteractive({ useHandCursor: true });
      this.cardBgs.push(bg);

      this.add.text(32, y + 12, `${char.emoji} ${char.name}`, {
        fontSize: '17px', color: '#e0e0e0', fontFamily: 'sans-serif',
      });

      const stars = '★'.repeat(char.difficulty) + '☆'.repeat(5 - char.difficulty);
      this.add.text(32, y + 38, `${char.playstyle} · 难度${stars}`, {
        fontSize: '11px', color: '#888', fontFamily: 'sans-serif',
      });

      this.add.text(32, y + 58, char.specialAbility, {
        fontSize: '11px', color: '#4a90d9', fontFamily: 'sans-serif',
      });

      this.add.text(width - 32, y + cardH / 2, `¥${char.startingCash.toLocaleString()}`, {
        fontSize: '16px', color: '#e0e0e0', fontFamily: 'monospace',
      }).setOrigin(1, 0.5);

      bg.on('pointerup', () => {
        this.selectedIndex = i;
        this.highlightCard(i);
        this.updateDetail(i);
      });
    });

    // 底部详情区
    const detailY = startY + 4 * (cardH + gap) + 10;
    this.add.rectangle(width / 2, detailY + 40, width - 40, 80, 0x16213e, 1)
      .setStrokeStyle(1, 0x333366);

    const descTxt = this.add.text(32, detailY + 12, '', {
      fontSize: '13px', color: '#ccc', fontFamily: 'sans-serif',
      wordWrap: { width: width - 64 },
    });
    const statsTxt = this.add.text(32, detailY + 36, '', {
      fontSize: '12px', color: '#aaa', fontFamily: 'sans-serif',
    });
    this.detailTexts = [descTxt, statsTxt];

    // 确认按钮
    const btnY = height - 60;
    const confirmBg = this.add.rectangle(width / 2, btnY, width - 40, 48, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, btnY, '✅ 确认选择', {
      fontSize: '17px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    confirmBg.on('pointerup', () => this.confirmSelection());

    // 默认选中第一个
    this.highlightCard(0);
    this.updateDetail(0);
  }

  private highlightCard(index: number): void {
    this.cardBgs.forEach((bg, i) => {
      bg.setStrokeStyle(i === index ? 2 : 1, i === index ? 0x4a90d9 : 0x333366);
    });
  }

  private updateDetail(index: number): void {
    const char = CHARACTERS[CHARACTER_ORDER[index]];
    this.detailTexts[0].setText(char.description);
    const salary = typeof char.dailySalary === 'number'
      ? `¥${char.dailySalary}` : `¥${char.dailySalary[0]}~${char.dailySalary[1]}`;
    this.detailTexts[1].setText(
      `日薪:${salary} · 生活费:¥${char.dailyLivingCost} · 事件:${char.eventFrequency}次/天`
    );
  }

  private confirmSelection(): void {
    const characterId = CHARACTER_ORDER[this.selectedIndex];
    const gm = getGameManager(this);
    gm.reset(characterId);
    this.scene.start('PreMarketScene');
  }
}
