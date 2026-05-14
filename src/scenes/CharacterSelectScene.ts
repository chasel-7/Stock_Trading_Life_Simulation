import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters';
import { getGameManager } from '../managers/GameManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private detailTexts: Phaser.GameObjects.Text[] = [];
  private cardBgs: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    Transition.fadeIn(this);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    this.add.text(GAME_WIDTH / 2, 36, '👤 选择你的角色', {
      fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 64, '每个角色是不同的资源约束和策略路线', {
      fontSize: '12px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    // 角色卡片
    const startY = 96;
    const cardH = 88;
    const gap = 10;

    CHARACTER_ORDER.forEach((id, i) => {
      const char = CHARACTERS[id];
      const y = startY + i * (cardH + gap);

      const bg = CardFactory.create(this, 20, y, GAME_WIDTH - 40, cardH, {
        interactive: true,
      });
      this.cardBgs.push(bg);

      this.add.text(32, y + 12, `${char.emoji} ${char.name}`, {
        fontSize: '17px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      });

      const stars = '★'.repeat(char.difficulty) + '☆'.repeat(5 - char.difficulty);
      this.add.text(32, y + 38, `${char.playstyle} · 难度${stars}`, {
        fontSize: '11px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      });

      this.add.text(32, y + 58, char.specialAbility, {
        fontSize: '11px', color: '#6c5ce7', fontFamily: THEME.font.primary,
      });

      this.add.text(GAME_WIDTH - 32, y + cardH / 2, `¥${char.startingCash.toLocaleString()}`, {
        fontSize: '16px', color: THEME.colors.textPrimary, fontFamily: THEME.font.mono,
      }).setOrigin(1, 0.5);

      bg.on('pointerup', () => {
        this.selectedIndex = i;
        this.highlightCard(i);
        this.updateDetail(i);
      });
    });

    // 底部详情区
    const detailY = startY + 4 * (cardH + gap) + 10;
    CardFactory.create(this, 20, detailY, GAME_WIDTH - 40, 80, {
      fillColor: THEME.colors.bgSecondary,
    });

    const descTxt = this.add.text(32, detailY + 12, '', {
      fontSize: '13px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      wordWrap: { width: GAME_WIDTH - 64 },
    });
    const statsTxt = this.add.text(32, detailY + 36, '', {
      fontSize: '12px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    });
    this.detailTexts = [descTxt, statsTxt];

    // 确认按钮
    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 40, 48,
      '✅ 确认选择', {
        onClick: () => this.confirmSelection(),
      },
    );

    // 默认选中第一个
    this.highlightCard(0);
    this.updateDetail(0);
  }

  private highlightCard(index: number): void {
    this.cardBgs.forEach((bg, i) => {
      bg.clear();
      const y = 96 + i * 98;
      const fillColor = i === index ? THEME.colors.bgCardHover : THEME.colors.bgCard;
      const strokeColor = i === index ? THEME.colors.borderActive : THEME.colors.border;
      const strokeWidth = i === index ? 2 : 1;
      bg.fillStyle(fillColor, 1);
      bg.fillRoundedRect(20, y, GAME_WIDTH - 40, 88, THEME.radius);
      bg.lineStyle(strokeWidth, strokeColor, i === index ? 1 : 0.6);
      bg.strokeRoundedRect(20, y, GAME_WIDTH - 40, 88, THEME.radius);
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
    Transition.fadeToScene(this, 'PreMarketScene');
  }
}
