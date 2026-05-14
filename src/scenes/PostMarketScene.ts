import Phaser from 'phaser';
import { getGameManager } from '../managers/GameManager';
import { getUnlockedScenes, getRandomEvents } from '../data/scenes';
import { EventCard } from '../ui/EventCard';
import type { SceneConfig, SceneEvent, EventResult } from '../models/sceneTypes';
import { calculateMood, getMoodEmoji } from '../utils/moodCalculator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { MoodLevel } from '../config/constants';


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
    this.totalSpending = 0;
    this.eventResults = [];

    const gm = getGameManager(this);
    const state = gm.state.getState();

    // 计算当前心情（基于今日收益率）
    if (state.dailySnapshots.length > 0) {
      const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
      this.currentMood = lastSnap.mood;
    } else {
      // 第一天用盘中收盘价估算
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

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const emoji = getMoodEmoji(this.currentMood);
    this.add.text(GAME_WIDTH / 2, 40, `🌙 盘后时光  ${emoji}`, {
      fontSize: '22px', color: '#9b59b6', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 72, '今晚去哪？', {
      fontSize: '14px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const scenes = getUnlockedScenes(this.currentMood);
    const gm = getGameManager(this);
    const discount = gm.getSocialDiscount();

    // 场景列表
    const startY = 110;

    scenes.forEach((sc, i) => {
      const y = startY + i * 100;
      const effectiveCost = Math.round(sc.cost * discount);

      const cardBg = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 40, 84, 0x1e1e3a, 1)
        .setStrokeStyle(1, 0x333366)
        .setInteractive({ useHandCursor: true });

      this.add.text(32, y - 20, `${sc.emoji} ${sc.name}`, {
        fontSize: '17px', color: '#e0e0e0', fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const costLabel = effectiveCost > 0 ? `¥${effectiveCost}` : '免费';
      const costColor = effectiveCost > 0 ? '#e74c3c' : '#2ecc71';
      this.add.text(GAME_WIDTH - 32, y - 20, costLabel, {
        fontSize: '15px', color: costColor, fontFamily: 'monospace',
      }).setOrigin(1, 0.5);

      // 折扣标识（销售经理）
      if (discount < 1 && sc.cost > 0) {
        this.add.text(GAME_WIDTH - 32, y - 4, `原¥${sc.cost}`, {
          fontSize: '10px', color: '#666', fontFamily: 'sans-serif',
        }).setOrigin(1, 0.5);
      }

      this.add.text(32, y + 10, sc.infoDescription, {
        fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      // Hover
      cardBg.on('pointerover', () => cardBg.setStrokeStyle(2, 0x4a90d9));
      cardBg.on('pointerout', () => cardBg.setStrokeStyle(1, 0x333366));

      cardBg.on('pointerup', () => this.selectScene(sc, Math.round(sc.cost * discount)));
    });
  }

  private selectScene(sc: SceneConfig, effectiveCost: number): void {
    this.selectedScene = sc;
    this.totalSpending += effectiveCost;

    // 获取随机事件
    this.eventQueue = getRandomEvents(sc.id, 2);

    this.showNextEvent();
  }

  private showNextEvent(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    if (this.eventQueue.length === 0) {
      this.showSummary();
      return;
    }

    const sc = this.selectedScene!;
    this.add.text(GAME_WIDTH / 2, 30, `${sc.emoji} ${sc.name}`, {
      fontSize: '18px', color: '#9b59b6', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, `事件 ${this.eventResults.length + 1}`, {
      fontSize: '13px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const event = this.eventQueue.shift()!;
    new EventCard(this, GAME_WIDTH / 2, 90, GAME_WIDTH - 40, event, (result) => {
      this.eventResults.push(result);
      this.totalSpending += result.cost;

      // 如果获得了信息，通过InfoManager记录
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
        }
      }

      // 处理特殊效果
      this.handleSpecialEffect(result.message);

      // 显示结果后进入下一事件
      this.time.delayedCall(300, () => this.showNextEvent());
    });
  }

  private handleSpecialEffect(message: string): void {
    const gm = getGameManager(this);

    // 手续费减半效果
    if (message.includes('手续费减半3天')) {
      gm.state.setCommissionDiscount(3);
    } else if (message.includes('手续费减半1天')) {
      gm.state.setCommissionDiscount(1);
    }
  }

  private showSummary(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const sc = this.selectedScene!;
    this.add.text(GAME_WIDTH / 2, 50, `${sc.emoji} 今晚的故事`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 事件回顾
    let y = 100;
    this.eventResults.forEach((r, i) => {
      const color = r.cost > 0 ? '#e74c3c' : '#2ecc71';
      this.add.text(28, y, `${i + 1}. ${r.message}`, {
        fontSize: '14px', color: '#ccc', fontFamily: 'sans-serif',
        wordWrap: { width: GAME_WIDTH - 56 },
      });
      if (r.cost > 0) {
        this.add.text(GAME_WIDTH - 28, y, `-¥${r.cost}`, {
          fontSize: '13px', color, fontFamily: 'monospace',
        }).setOrigin(1, 0);
      }
      if (r.gotInfo) {
        this.add.text(28, y + 22, `📋 获得信息 (可靠度${Math.round(r.infoAccuracy * 100)}%)`, {
          fontSize: '12px', color: '#4a90d9', fontFamily: 'sans-serif',
        });
        y += 20;
      }
      y += 44;
    });

    // 总花费
    this.add.text(GAME_WIDTH / 2, y + 20, `今晚总花费: ¥${this.totalSpending}`, {
      fontSize: '16px', color: '#e74c3c', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 进入结算
    const btnY = GAME_HEIGHT - 80;
    const btn = this.add.rectangle(GAME_WIDTH / 2, btnY, GAME_WIDTH - 40, 48, 0xf39c12, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, btnY, '💰 进入日结算', {
      fontSize: '17px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btn.on('pointerup', () => {
      this.scene.start('SettlementScene', { sceneSpending: this.totalSpending });
    });
  }
}
