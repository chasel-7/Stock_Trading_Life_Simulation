import Phaser from 'phaser';
import { getGameManager } from '../managers/GameManager';
import { SettlementManager } from '../managers/SettlementManager';
import { SaveManager } from '../managers/SaveManager';
import { getCharacter } from '../data/characters';
import { getMoodEmoji, getMoodLabel } from '../utils/moodCalculator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class SettlementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettlementScene' });
  }

  create(data?: { sceneSpending?: number }): void {
    const gm = getGameManager(this);
    const char = getCharacter(gm.state.getState().characterId);
    const day = gm.state.getState().currentDay - 1;

    // 获取收盘价
    const currentPrices: Record<string, number> = {};
    for (const id of gm.stocks.getStockIds()) {
      currentPrices[id] = gm.stocks.getClosePrice(id, day);
    }

    // 日薪计算（自由职业者随机）
    let salary = 0;
    if (typeof char.dailySalary === 'number') {
      salary = char.dailySalary;
    } else {
      const [min, max] = char.dailySalary;
      salary = Math.round(min + Math.random() * (max - min));
    }

    // 执行结算
    const result = SettlementManager.settle(gm.state, {
      dailySalary: salary,
      dailyLivingCost: char.dailyLivingCost,
      sceneSpending: data?.sceneSpending || 0,
      currentPrices,
    });

    // 自动存档
    SaveManager.save(gm.state.getState());

    // === UI ===
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    // 标题
    const emoji = getMoodEmoji(result.mood);
    const label = getMoodLabel(result.mood);
    this.add.text(GAME_WIDTH / 2, 50, `${emoji} ${label}`, {
      fontSize: '28px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 结算明细卡片
    const cardX = 24, cardY = 100, cardW = GAME_WIDTH - 48;
    this.add.rectangle(cardX, cardY, cardW, 240, 0x1e1e3a, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x333366);

    const lines = [
      { label: '💼 日薪收入', value: `+¥${result.salaryIncome}`, color: '#2ecc71' },
      { label: '🏠 生活成本', value: `-¥${result.livingCost}`, color: '#e74c3c' },
      { label: '🎭 场景花费', value: `-¥${result.sceneSpending}`, color: '#e74c3c' },
      { label: '⚡ 突发事件', value: `-¥${result.eventCosts}`, color: '#e74c3c' },
      { label: '───────', value: '──────', color: '#444' },
      { label: '💰 现金余额', value: `¥${result.cashAfter.toLocaleString()}`, color: '#e0e0e0' },
      { label: '📈 持仓市值', value: `¥${result.holdingsValue.toLocaleString()}`, color: '#e0e0e0' },
      { label: '💎 总资产', value: `¥${result.totalAssets.toLocaleString()}`, color: '#ffd700' },
    ];

    lines.forEach((line, i) => {
      const ly = cardY + 20 + i * 28;
      this.add.text(cardX + 16, ly, line.label, {
        fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
      });
      this.add.text(cardX + cardW - 16, ly, line.value, {
        fontSize: '14px', color: line.color, fontFamily: 'monospace',
      }).setOrigin(1, 0);
    });

    // 日收益率
    const retSign = result.dailyReturn >= 0 ? '+' : '';
    const retColor = result.dailyReturn >= 0 ? '#e74c3c' : '#2ecc71';
    this.add.text(GAME_WIDTH / 2, cardY + 260, `日收益率: ${retSign}${(result.dailyReturn * 100).toFixed(2)}%`, {
      fontSize: '16px', color: retColor, fontFamily: 'monospace',
    }).setOrigin(0.5);

    // 底部按钮
    const btnY = GAME_HEIGHT - 80;
    if (result.isBankrupt || result.isWin || result.isTimeout) {
      // 游戏结束
      const endLabel = result.isBankrupt ? '💀 破产了...' :
                       result.isWin ? '🏆 达标！' : '📅 交易期结束';
      this.add.text(GAME_WIDTH / 2, btnY - 40, endLabel, {
        fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      const reviewBg = this.add.rectangle(GAME_WIDTH / 2, btnY + 10, GAME_WIDTH - 40, 48, 0x9b59b6, 1)
        .setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH / 2, btnY + 10, '📊 查看复盘', {
        fontSize: '17px', color: '#fff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      reviewBg.on('pointerup', () => {
        // Phase 6 实现复盘场景，暂时回到Boot
        this.scene.start('BootScene');
      });
    } else {
      const nextBg = this.add.rectangle(GAME_WIDTH / 2, btnY, GAME_WIDTH - 40, 48, 0x4a90d9, 1)
        .setInteractive({ useHandCursor: true });
      this.add.text(GAME_WIDTH / 2, btnY, `➡️ 进入第 ${gm.state.getState().currentDay} 天`, {
        fontSize: '17px', color: '#fff', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      nextBg.on('pointerup', () => {
        gm.state.setPhase('pre-market');
        this.scene.start('PreMarketScene');
      });
    }
  }
}
