import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { getGameManager } from '../managers/GameManager';
import { getUnlockedScenes, getRandomEvents } from '../data/scenes';
import { EventCard } from '../ui/EventCard';
import type { SceneConfig, SceneEvent, EventResult } from '../models/sceneTypes';
import { calculateMood, getMoodEmoji } from '../utils/moodCalculator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { MoodLevel } from '../config/constants';
import { TutorialManager } from '../managers/TutorialManager';


export class PostMarketScene extends Phaser.Scene {
  private selectedScene: SceneConfig | null = null;
  private totalSpending = 0;
  private eventResults: EventResult[] = [];
  private eventQueue: SceneEvent[] = [];
  private currentMood: MoodLevel = MoodLevel.NEUTRAL;

  constructor() {
    super({ key: 'PostMarketScene' });
  }

  create(): void {
    Transition.fadeIn(this);

    this.totalSpending = 0;
    this.eventResults = [];

    const gm = getGameManager(this);
    const state = gm.state.getState();

    // 计算当前心情
    if (state.dailySnapshots.length > 0) {
      const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
      this.currentMood = lastSnap.mood;
    } else {
      const day = state.currentDay - 1;
      const stockIds = gm.stocks.getStockIds();
      let totalChange = 0;
      for (const id of stockIds) {
        const dd = gm.stocks.getDailyData(id, day);
        totalChange += (dd.close - dd.open) / dd.open;
      }
      const avgReturn = totalChange / stockIds.length;
      this.currentMood = calculateMood(avgReturn);
    }

    this.showSceneSelect();
  }

  private showSceneSelect(): void {
    this.children.removeAll();

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    const emoji = getMoodEmoji(this.currentMood);
    this.add.text(GAME_WIDTH / 2, 40, `🌙 盘后时光  ${emoji}`, {
      fontSize: '22px', color: '#9b59b6', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 72, '今晚去哪？', {
      fontSize: '14px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    const scenes = getUnlockedScenes(this.currentMood);
    const gm = getGameManager(this);
    const discount = gm.getSocialDiscount();

    const startY = 110;

    scenes.forEach((sc, i) => {
      const y = startY + i * 100;
      const effectiveCost = Math.round(sc.cost * discount);

      const cardBg = CardFactory.create(this, 20, y - 42, GAME_WIDTH - 40, 84, {
        interactive: true,
      });

      this.add.text(32, y - 20, `${sc.emoji} ${sc.name}`, {
        fontSize: '17px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      }).setOrigin(0, 0.5);

      const costLabel = effectiveCost > 0 ? `¥${effectiveCost}` : '免费';
      const costColor = effectiveCost > 0 ? THEME.colors.rise : THEME.colors.fall;
      this.add.text(GAME_WIDTH - 32, y - 20, costLabel, {
        fontSize: '15px', color: costColor, fontFamily: THEME.font.mono,
      }).setOrigin(1, 0.5);

      // 折扣标识
      if (discount < 1 && sc.cost > 0) {
        this.add.text(GAME_WIDTH - 32, y - 4, `原¥${sc.cost}`, {
          fontSize: '10px', color: THEME.colors.textMuted, fontFamily: THEME.font.primary,
        }).setOrigin(1, 0.5);
      }

      this.add.text(32, y + 10, sc.infoDescription, {
        fontSize: '12px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      }).setOrigin(0, 0.5);

      // Hover效果 — 缩放
      cardBg.on('pointerover', () => {
        this.tweens.add({ targets: cardBg, scaleX: 1.02, scaleY: 1.02, duration: 150 });
      });
      cardBg.on('pointerout', () => {
        this.tweens.add({ targets: cardBg, scaleX: 1, scaleY: 1, duration: 150 });
      });

      cardBg.on('pointerup', () => this.selectScene(sc, Math.round(sc.cost * discount)));
    });

    // 教学引导
    const state = gm.state.getState();
    TutorialManager.inject(this, state.currentDay, 'post-market');
  }

  private selectScene(sc: SceneConfig, effectiveCost: number): void {
    this.selectedScene = sc;
    this.totalSpending += effectiveCost;
    this.eventQueue = getRandomEvents(sc.id, 2);
    this.showNextEvent();
  }

  private showNextEvent(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    if (this.eventQueue.length === 0) {
      this.showSummary();
      return;
    }

    const sc = this.selectedScene!;
    this.add.text(GAME_WIDTH / 2, 30, `${sc.emoji} ${sc.name}`, {
      fontSize: '18px', color: '#9b59b6', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, `事件 ${this.eventResults.length + 1}`, {
      fontSize: '13px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    const event = this.eventQueue.shift()!;
    new EventCard(this, GAME_WIDTH / 2, 90, GAME_WIDTH - 40, event, (result) => {
      this.eventResults.push(result);
      this.totalSpending += result.cost;

      if (result.gotInfo) {
        const gm = getGameManager(this);
        const state = gm.state.getState();
        const info = gm.info.generateInfo(
          this.selectedScene!.id,
          result.infoAccuracy,
          state.currentDay,
        );
        if (info) {
          gm.info.addInfo(info);
          gm.state.addInfo(info);
          if (gm.info.checkChain(info.stockId)) {
            result.message += ` 🔗 情报串联触发！${info.stockId} 已获多源验证`;
          }
        }
      }

      this.handleSpecialEffect(result.message);
      this.time.delayedCall(300, () => this.showNextEvent());
    });
  }

  private handleSpecialEffect(message: string): void {
    const gm = getGameManager(this);
    if (message.includes('手续费减半3天')) {
      gm.state.setCommissionDiscount(3);
    } else if (message.includes('手续费减半1天')) {
      gm.state.setCommissionDiscount(1);
    }
  }

  private showSummary(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    const sc = this.selectedScene!;
    this.add.text(GAME_WIDTH / 2, 50, `${sc.emoji} 今晚的故事`, {
      fontSize: '20px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    let y = 100;
    this.eventResults.forEach((r, i) => {
      const color = r.cost > 0 ? THEME.colors.rise : THEME.colors.fall;
      this.add.text(28, y, `${i + 1}. ${r.message}`, {
        fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
        wordWrap: { width: GAME_WIDTH - 56 },
      });
      if (r.cost > 0) {
        this.add.text(GAME_WIDTH - 28, y, `-¥${r.cost}`, {
          fontSize: '13px', color, fontFamily: THEME.font.mono,
        }).setOrigin(1, 0);
      }
      if (r.gotInfo) {
        this.add.text(28, y + 22, `📋 获得信息 (可靠度${Math.round(r.infoAccuracy * 100)}%)`, {
          fontSize: '12px', color: '#6c5ce7', fontFamily: THEME.font.primary,
        });
        y += 20;
      }
      y += 44;
    });

    this.add.text(GAME_WIDTH / 2, y + 20, `今晚总花费: ¥${this.totalSpending}`, {
      fontSize: '16px', color: THEME.colors.rise, fontFamily: THEME.font.mono,
    }).setOrigin(0.5);

    // 进入结算
    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH - 40, 48,
      '💰 进入日结算', {
        color: 0xf39c12,
        onClick: () => {
          Transition.fadeToScene(this, 'SettlementScene', { sceneSpending: this.totalSpending });
        },
      },
    );
  }
}
