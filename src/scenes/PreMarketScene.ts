import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { getGameManager } from '../managers/GameManager';
import { AbilityManager } from '../managers/AbilityManager';
import { generateDailyBrief } from '../utils/marketTrend';
import { getMoodEmoji } from '../utils/moodCalculator';
import { InfoPanel } from '../ui/InfoPanel';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import type { DailyStockData } from '../models/types';
import { TutorialManager } from '../managers/TutorialManager';
import { DialogBubble } from '../ui/DialogBubble';

export class PreMarketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreMarketScene' });
  }

  create(): void {
    Transition.fadeIn(this);

    const gm = getGameManager(this);
    const state = gm.state.getState();
    const day = state.currentDay - 1;

    // 背景
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    // 顶部日期栏
    this.add.rectangle(0, 0, GAME_WIDTH, 60, THEME.colors.bgSecondary, 1).setOrigin(0, 0);
    this.add.text(GAME_WIDTH / 2, 30, `☀️ 第 ${state.currentDay} / ${state.totalDays} 天`, {
      fontSize: '20px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    // 资产概览卡片
    const cardY = 76;
    CardFactory.create(this, 16, cardY, GAME_WIDTH - 32, 80);
    this.add.text(28, cardY + 12, '💰 流动现金', {
      fontSize: '12px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    });
    this.add.text(28, cardY + 36, `¥${state.cash.toLocaleString()}`, {
      fontSize: '22px', color: THEME.colors.textPrimary, fontFamily: THEME.font.mono,
    });
    // 昨日心情
    if (state.dailySnapshots.length > 0) {
      const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
      const emoji = getMoodEmoji(lastSnap.mood);
      this.add.text(GAME_WIDTH - 28, cardY + 30, emoji, {
        fontSize: '36px',
      }).setOrigin(1, 0.5);
    }

    // 大盘简报
    const briefY = cardY + 96;
    CardFactory.create(this, 16, briefY, GAME_WIDTH - 32, 60);
    this.add.text(28, briefY + 8, '📰 今日市场概览', {
      fontSize: '13px', color: '#6c5ce7', fontFamily: THEME.font.primary,
    });

    const stockIds = gm.stocks.getStockIds();
    const todayData: Record<string, DailyStockData> = {};
    for (const id of stockIds) {
      todayData[id] = gm.stocks.getDailyData(id, day);
    }
    const brief = generateDailyBrief(todayData);
    this.add.text(28, briefY + 32, brief.summary, {
      fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
    });

    // 推荐关注
    const listY = briefY + 80;
    this.add.text(16, listY, '📊 推荐关注', {
      fontSize: '14px', color: '#ffd700', fontFamily: THEME.font.primary,
    });

    const recommended = stockIds.filter(id => gm.stocks.isRecommended(id));
    recommended.forEach((id, i) => {
      const dd = todayData[id];
      const prevClose = day > 0 ? gm.stocks.getClosePrice(id, day - 1) : dd.open;
      const change = ((dd.open - prevClose) / prevClose * 100).toFixed(2);
      const color = dd.open >= prevClose ? THEME.colors.rise : THEME.colors.fall;
      const sign = dd.open >= prevClose ? '+' : '';
      const y = listY + 28 + i * 32;
      this.add.text(28, y, `⭐ ${id}`, {
        fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      });
      this.add.text(GAME_WIDTH - 28, y, `¥${dd.open.toFixed(2)}  ${sign}${change}%`, {
        fontSize: '13px', color, fontFamily: THEME.font.mono,
      }).setOrigin(1, 0);
    });

    // 角色特殊能力
    const ability = AbilityManager.getPreMarketAbility(
      state.characterId,
      gm.stocks.getStockIds(),
      state.currentDay,
    );
    const abilityY = listY + recommended.length * 32 + 40;
    if (ability.message) {
      this.add.text(16, abilityY, ability.message, {
        fontSize: '13px', color: '#6c5ce7', fontFamily: THEME.font.primary,
      });
    }
    if (ability.info) {
      gm.info.addInfo(ability.info);
      this.add.text(16, abilityY + 24,
        `📋 ${ability.info.content}`, {
        fontSize: '13px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
        wordWrap: { width: GAME_WIDTH - 32 },
      });
    }

    // 情报按钮
    const infoBtnBg = this.add.rectangle(GAME_WIDTH - 50, 30, 32, 32, THEME.colors.border, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH - 50, 30, '📋', { fontSize: '18px' }).setOrigin(0.5);
    let infoPanel: InfoPanel | null = null;
    infoBtnBg.on('pointerup', () => {
      if (infoPanel) {
        infoPanel.destroy();
        infoPanel = null;
        return;
      }
      const allInfo = gm.info.getAllInfo();
      const chainedStocks = gm.stocks.getStockIds().filter(id => gm.info.checkChain(id));
      infoPanel = new InfoPanel(this, 0, 0, GAME_WIDTH, GAME_HEIGHT, allInfo, chainedStocks, () => {
        infoPanel?.destroy();
        infoPanel = null;
      });
    });

    // 底部按钮
    const btnY = GAME_HEIGHT - 100;
    CardFactory.createButton(
      this, GAME_WIDTH / 2, btnY, GAME_WIDTH - 40, 48,
      '📈 进入盘中交易', {
        onClick: () => {
          gm.state.setPhase('trading');
          Transition.fadeToScene(this, 'TradingScene');
        },
      },
    );

    CardFactory.createButton(
      this, GAME_WIDTH / 2, btnY + 56, GAME_WIDTH - 40, 40,
      '⏭️ 不看盘，直接进入盘后', {
        color: THEME.colors.border,
        textColor: THEME.colors.textSecondary,
        fontSize: '14px',
        onClick: () => {
          gm.state.setPhase('post-market');
          Transition.fadeToScene(this, 'PostMarketScene');
        },
      },
    );

    // 教学引导
    const tutorial = this.registry.get('tutorialManager') as TutorialManager | undefined;
    if (tutorial) {
      const steps = tutorial.getStepsForPhase(state.currentDay, 'pre-market');
      if (steps.length > 0) {
        let idx = 0;
        const showNext = () => {
          if (idx >= steps.length) return;
          const step = steps[idx];
          new DialogBubble(this, {
            npcName: step.npcName,
            npcEmoji: step.npcEmoji,
            message: step.message,
            highlightArea: step.highlightArea,
            onDismiss: () => {
              tutorial.complete(step.id);
              idx++;
              showNext();
            },
            onSkip: () => tutorial.skipAll(),
          });
        };
        showNext();
      }
    }
  }
}
