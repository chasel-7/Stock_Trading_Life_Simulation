import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { getGameManager } from '../managers/GameManager';
import { SettlementManager } from '../managers/SettlementManager';
import { SaveManager } from '../managers/SaveManager';
import { LifeEventManager } from '../managers/LifeEventManager';
import { LifeEventPopup } from '../ui/LifeEventPopup';
import { audioManager } from '../managers/AudioManager';
import { getCharacter } from '../data/characters';
import { getMoodEmoji, getMoodLabel } from '../utils/moodCalculator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import type { LifeEvent } from '../data/lifeEvents';
import type { LifeEventPopupResult } from '../ui/LifeEventPopup';
import type { SettlementResult } from '../managers/SettlementManager';
import { TutorialManager } from '../managers/TutorialManager';

export class SettlementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettlementScene' });
  }

  create(data?: { sceneSpending?: number }): void {
    const gm = getGameManager(this);
    const char = getCharacter(gm.state.getState().characterId);
    const state = gm.state.getState();
    const day = state.currentDay - 1;

    // 获取收盘价
    const currentPrices: Record<string, number> = {};
    for (const id of gm.stocks.getStockIds()) {
      currentPrices[id] = gm.stocks.getClosePrice(id, day);
    }

    // 估算今日亏损
    const prevTotal = state.dailySnapshots.length > 0
      ? state.dailySnapshots[state.dailySnapshots.length - 1].totalAssets
      : state.startingCash;
    let currentHoldingsValue = 0;
    for (const h of state.holdings) {
      currentHoldingsValue += h.shares * (currentPrices[h.stockId] || 0);
    }
    const estimatedTotal = state.cash + currentHoldingsValue;
    const dailyLoss = estimatedTotal - prevTotal;
    const isBigLoss = prevTotal > 0 && (dailyLoss / prevTotal < -0.08);

    // 掷骰生活事件
    const lifeEventMgr = new LifeEventManager(char.eventFrequency);
    const rolledEvents = lifeEventMgr.rollDailyEvents(isBigLoss);

    this.showLifeEventsThenSettle(rolledEvents, state.cash, dailyLoss, {
      char,
      currentPrices,
      sceneSpending: data?.sceneSpending || 0,
    });
  }

  private showLifeEventsThenSettle(
    events: LifeEvent[],
    cash: number,
    dailyLoss: number,
    params: { char: ReturnType<typeof getCharacter>; currentPrices: Record<string, number>; sceneSpending: number },
  ): void {
    let totalEventCost = 0;
    const queue = [...events];

    const processNext = (): void => {
      if (queue.length === 0) {
        this.executeSettlement(params, totalEventCost);
        return;
      }
      const ev = queue.shift()!;
      audioManager.playBad();
      new LifeEventPopup(
        this, GAME_WIDTH, GAME_HEIGHT,
        ev, cash, dailyLoss,
        (result: LifeEventPopupResult) => {
          totalEventCost += result.cost;
          cash -= result.cost;
          this.time.delayedCall(200, processNext);
        },
      );
    };

    processNext();
  }

  private executeSettlement(
    params: { char: ReturnType<typeof getCharacter>; currentPrices: Record<string, number>; sceneSpending: number },
    eventCosts: number,
  ): void {
    const gm = getGameManager(this);
    const { char, currentPrices, sceneSpending } = params;

    let salary = 0;
    if (typeof char.dailySalary === 'number') {
      salary = char.dailySalary;
    } else {
      const [min, max] = char.dailySalary;
      salary = Math.round(min + Math.random() * (max - min));
    }

    gm.state.tickCommissionDiscount();

    const result = SettlementManager.settle(gm.state, {
      dailySalary: salary,
      dailyLivingCost: char.dailyLivingCost,
      sceneSpending,
      currentPrices,
      eventCosts,
    });

    SaveManager.save(gm.state.getState());

    audioManager.playSettle();
    this.renderSettlementUI(result);
  }

  private renderSettlementUI(result: SettlementResult): void {
    const gm = getGameManager(this);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    // 标题
    const emoji = getMoodEmoji(result.mood);
    const label = getMoodLabel(result.mood);
    this.add.text(GAME_WIDTH / 2, 50, `${emoji} ${label}`, {
      fontSize: '28px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    // 结算明细卡片
    const cardX = 24, cardY = 100, cardW = GAME_WIDTH - 48;
    CardFactory.create(this, cardX, cardY, cardW, 240);

    const lines = [
      { label: '💼 日薪收入', value: `+¥${result.salaryIncome}`, color: THEME.colors.fall },
      { label: '🏠 生活成本', value: `-¥${result.livingCost}`, color: THEME.colors.rise },
      { label: '🎭 场景花费', value: `-¥${result.sceneSpending}`, color: THEME.colors.rise },
      { label: '⚡ 突发事件', value: `-¥${result.eventCosts}`, color: result.eventCosts > 0 ? THEME.colors.rise : THEME.colors.textMuted },
      { label: '───────', value: '──────', color: THEME.colors.textMuted },
      { label: '💰 现金余额', value: `¥${result.cashAfter.toLocaleString()}`, color: THEME.colors.textPrimary },
      { label: '📈 持仓市值', value: `¥${result.holdingsValue.toLocaleString()}`, color: THEME.colors.textPrimary },
      { label: '💎 总资产', value: `¥${result.totalAssets.toLocaleString()}`, color: '#ffd700' },
    ];

    lines.forEach((line, i) => {
      const ly = cardY + 20 + i * 28;
      this.add.text(cardX + 16, ly, line.label, {
        fontSize: '14px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      });
      const valueTxt = this.add.text(cardX + cardW - 16, ly, '', {
        fontSize: '14px', color: line.color, fontFamily: THEME.font.mono,
      }).setOrigin(1, 0);
      // 数字滚动动画（仅金额行）
      if (i === 5 || i === 6 || i === 7) {
        const numVal = parseInt(line.value.replace(/[^0-9-]/g, ''));
        if (!isNaN(numVal) && numVal > 0) {
          Transition.countUp(this, valueTxt, 0, numVal, 800, '¥');
        } else {
          valueTxt.setText(line.value);
        }
      } else {
        valueTxt.setText(line.value);
      }
    });

    // 日收益率
    const retSign = result.dailyReturn >= 0 ? '+' : '';
    const retColor = result.dailyReturn >= 0 ? THEME.colors.rise : THEME.colors.fall;
    this.add.text(GAME_WIDTH / 2, cardY + 260, `日收益率: ${retSign}${(result.dailyReturn * 100).toFixed(2)}%`, {
      fontSize: '16px', color: retColor, fontFamily: THEME.font.mono,
    }).setOrigin(0.5);

    // 底部按钮
    const btnY = GAME_HEIGHT - 80;
    if (result.isBankrupt || result.isWin || result.isTimeout) {
      const endLabel = result.isBankrupt ? '💀 破产了...' :
                       result.isWin ? '🏆 达标！' : '📅 交易期结束';
      this.add.text(GAME_WIDTH / 2, btnY - 40, endLabel, {
        fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
      }).setOrigin(0.5);

      CardFactory.createButton(
        this, GAME_WIDTH / 2, btnY + 10, GAME_WIDTH - 40, 48,
        '📊 查看复盘', {
          color: 0x9b59b6,
          onClick: () => Transition.fadeToScene(this, 'ReviewScene'),
        },
      );
    } else {
      CardFactory.createButton(
        this, GAME_WIDTH / 2, btnY, GAME_WIDTH - 40, 48,
        `➡️ 进入第 ${gm.state.getState().currentDay} 天`, {
          onClick: () => {
            gm.state.setPhase('pre-market');
            Transition.fadeToScene(this, 'PreMarketScene');
          },
        },
      );
    }

    // 教学引导
    const state = gm.state.getState();
    TutorialManager.inject(this, state.currentDay - 1, 'settlement');

    // Day 2结算后标记教学完成
    const tutorial = this.registry.get('tutorialManager') as TutorialManager | undefined;
    if (tutorial && state.currentDay - 1 >= 2) {
      tutorial.markTutorialDone();
    }
  }
}
