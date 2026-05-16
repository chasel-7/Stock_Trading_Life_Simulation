import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { SaveManager } from '../managers/SaveManager';
import { getGameManager } from '../managers/GameManager';
import { TutorialManager } from '../managers/TutorialManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // 游玩次数（用于解锁随机模式）
    const PLAY_COUNT_KEY = 'stock-life-play-count';
    let playCount = 0;
    try { playCount = parseInt(localStorage.getItem(PLAY_COUNT_KEY) || '0'); } catch { /* noop */ }
    const randomUnlocked = playCount >= 2;

    // 背景
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    // 背景辉光
    const glow = this.add.graphics();
    glow.fillStyle(THEME.colors.accentGlow, 0.05);
    glow.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 3, 200);

    // 标题动画
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 - 20, '股票人生模拟器', {
      fontSize: '30px', color: THEME.colors.textPrimary,
      fontFamily: THEME.font.primary,
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 24, '所有的选择都有价格', {
      fontSize: '14px', color: THEME.colors.textSecondary,
      fontFamily: THEME.font.primary,
    }).setOrigin(0.5).setAlpha(0);

    // 动画序列
    this.tweens.add({
      targets: title, alpha: 1, y: GAME_HEIGHT / 3, duration: 800,
      ease: 'Power2', delay: 200,
    });
    this.tweens.add({
      targets: subtitle, alpha: 1, duration: 600, delay: 700,
    });

    const startNewGame = (useRandom: boolean) => {
      SaveManager.deleteSave();
      const switchFn = this.registry.get(useRandom ? 'switchToRandomMarket' : 'switchToFixedMarket') as (() => void) | undefined;
      if (switchFn) switchFn();
      try { localStorage.setItem(PLAY_COUNT_KEY, String(playCount + 1)); } catch { /* noop */ }
      const tutorial = new TutorialManager();
      if (useRandom) tutorial.skipAll();
      this.registry.set('tutorialManager', tutorial);
      Transition.fadeToScene(this, 'CharacterSelectScene');
    };

    // 新游戏按钮（固定行情）
    let nextY = GAME_HEIGHT / 2 + 60;
    const newBtn = CardFactory.createButton(
      this, GAME_WIDTH / 2, nextY, 240, 48,
      '🎮 新游戏（固定行情）', {
        onClick: () => startNewGame(false),
      },
    ).setAlpha(0);
    this.tweens.add({ targets: newBtn, alpha: 1, delay: 1000, duration: 400 });
    nextY += 56;

    // 随机行情按钮（解锁后显示）
    if (randomUnlocked) {
      const randBtn = CardFactory.createButton(
        this, GAME_WIDTH / 2, nextY, 240, 44,
        '🎲 新游戏（随机行情）', {
          color: 0x6c5ce7,
          fontSize: '14px',
          onClick: () => startNewGame(true),
        },
      ).setAlpha(0);
      this.tweens.add({ targets: randBtn, alpha: 1, delay: 1100, duration: 400 });
      nextY += 52;
    } else {
      const lockTxt = this.add.text(GAME_WIDTH / 2, nextY,
        `🔒 完成${2 - playCount}局后解锁随机行情`, {
        fontSize: '11px', color: THEME.colors.textMuted, fontFamily: THEME.font.primary,
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: lockTxt, alpha: 1, delay: 1100, duration: 400 });
      nextY += 30;
    }

    // 继续游戏
    if (SaveManager.hasSave()) {
      nextY += 8;
      const contBtn = CardFactory.createButton(
        this, GAME_WIDTH / 2, nextY, 240, 48,
        '📂 继续游戏', {
          color: THEME.colors.positive,
          onClick: () => {
            const saved = SaveManager.load();
            if (saved) {
              const gm = getGameManager(this);
              gm.state.loadState(saved);
              const phase = saved.phase;
              if (phase === 'trading') {
                Transition.fadeToScene(this, 'TradingScene');
              } else if (phase === 'post-market') {
                Transition.fadeToScene(this, 'PostMarketScene');
              } else if (phase === 'settlement') {
                Transition.fadeToScene(this, 'SettlementScene');
              } else {
                Transition.fadeToScene(this, 'PreMarketScene');
              }
            }
          },
        },
      ).setAlpha(0);
      this.tweens.add({ targets: contBtn, alpha: 1, delay: 1200, duration: 400 });

      // 存档信息预览
      const saved = SaveManager.load();
      if (saved) {
        this.add.text(GAME_WIDTH / 2, nextY + 36, `📊 第${saved.currentDay}天 | ¥${saved.cash.toLocaleString()}`, {
          fontSize: '12px', color: THEME.colors.textMuted, fontFamily: THEME.font.primary,
        }).setOrigin(0.5);
      }
      nextY += 64;
    }

    // 排行榜按钮
    nextY += 8;
    const lbBtn = CardFactory.createButton(
      this, GAME_WIDTH / 2, nextY, 240, 44,
      '🏆 排行榜', {
        color: THEME.colors.border,
        textColor: THEME.colors.textSecondary,
        fontSize: '15px',
        onClick: () => this.scene.start('LeaderboardScene'),
      },
    ).setAlpha(0);
    this.tweens.add({
      targets: lbBtn,
      alpha: 1, delay: 1400, duration: 400,
    });

    // 版本号
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'v1.1 · Stock Life Simulator', {
      fontSize: '11px', color: THEME.colors.textMuted,
      fontFamily: THEME.font.primary,
    }).setOrigin(0.5);
  }
}
