import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { LEADERBOARD_CONFIGS, type LeaderboardCategory } from '../models/leaderboardTypes';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class LeaderboardScene extends Phaser.Scene {
  private currentCategory: LeaderboardCategory = 'total-return';
  private listContainer!: Phaser.GameObjects.Container;
  private leaderboard!: LeaderboardManager;
  private tabs: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    this.leaderboard = new LeaderboardManager();

    // 背景
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    // 标题
    this.add.text(GAME_WIDTH / 2, 32, '🏆 排行榜', {
      fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    // Tab栏（4个分类）
    const tabY = 72;
    this.tabs = [];
    LEADERBOARD_CONFIGS.forEach((config, i) => {
      const tabW = (GAME_WIDTH - 32) / 4;
      const tabX = 16 + i * tabW + tabW / 2;
      const tab = this.add.text(tabX, tabY, `${config.emoji}\n${config.name}`, {
        fontSize: '11px', color: '#aaa', fontFamily: THEME.font.primary, align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      tab.on('pointerup', () => {
        this.currentCategory = config.category;
        this.renderList();
      });
      this.tabs.push(tab);
    });

    // 列表容器
    this.listContainer = this.add.container(0, 120);
    this.renderList();

    // 返回按钮
    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 50, GAME_WIDTH - 40, 44,
      '← 返回', {
        color: THEME.colors.border,
        onClick: () => this.scene.start('BootScene'),
      },
    );
  }

  private renderList(): void {
    this.listContainer.removeAll(true);

    // 更新Tab高亮
    const activeIdx = LEADERBOARD_CONFIGS.findIndex(c => c.category === this.currentCategory);
    this.tabs.forEach((tab, i) => {
      tab.setColor(i === activeIdx ? '#ffd700' : '#aaa');
    });

    const entries = this.leaderboard.getTop(this.currentCategory, 20);
    const config = LEADERBOARD_CONFIGS.find(c => c.category === this.currentCategory)!;

    if (entries.length === 0) {
      this.listContainer.add(this.add.text(GAME_WIDTH / 2, 100, '暂无记录\n完成一局游戏后自动上榜', {
        fontSize: '14px', color: '#666', fontFamily: THEME.font.primary, align: 'center',
      }).setOrigin(0.5));
      return;
    }

    entries.forEach((entry, i) => {
      const y = i * 52;
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const value = entry[config.sortField];
      const valueStr = config.category === 'total-return'
        ? `${((value as number) * 100).toFixed(1)}%`
        : `${value}分`;

      // 排名
      this.listContainer.add(this.add.text(24, y + 8, `${rankEmoji}`, {
        fontSize: '16px', fontFamily: THEME.font.primary,
      }));

      // 角色 + 名字
      this.listContainer.add(this.add.text(56, y + 4, `${entry.characterEmoji} ${entry.playerName}`, {
        fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      }));

      // 称号
      this.listContainer.add(this.add.text(56, y + 24, entry.title, {
        fontSize: '11px', color: THEME.colors.textMuted, fontFamily: THEME.font.primary,
      }));

      // 分数
      const valueColor = config.category === 'total-return' && (value as number) < 0
        ? THEME.colors.fall
        : '#4a90d9';
      this.listContainer.add(this.add.text(GAME_WIDTH - 24, y + 12, valueStr, {
        fontSize: '15px', color: valueColor, fontFamily: THEME.font.mono,
      }).setOrigin(1, 0));

      // 分割线
      if (i < entries.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, THEME.colors.border, 0.3);
        line.lineBetween(24, y + 48, GAME_WIDTH - 24, y + 48);
        this.listContainer.add(line);
      }
    });
  }
}
