import Phaser from 'phaser';
import { getGameManager } from '../managers/GameManager';
import { generateDailyBrief } from '../utils/marketTrend';
import { getMoodEmoji } from '../utils/moodCalculator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import type { DailyStockData } from '../models/types';

export class PreMarketScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreMarketScene' });
  }

  create(): void {
    const gm = getGameManager(this);
    const state = gm.state.getState();
    const day = state.currentDay - 1;

    // 背景渐变模拟
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    // 顶部日期栏
    this.add.rectangle(0, 0, GAME_WIDTH, 60, 0x16213e, 1).setOrigin(0, 0);
    this.add.text(GAME_WIDTH / 2, 30, `☀️ 第 ${state.currentDay} / ${state.totalDays} 天`, {
      fontSize: '20px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 资产概览卡片
    const cardY = 76;
    this.add.rectangle(16, cardY, GAME_WIDTH - 32, 80, 0x1e1e3a, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x333366);
    this.add.text(28, cardY + 12, '💰 流动现金', {
      fontSize: '12px', color: '#888', fontFamily: 'sans-serif',
    });
    this.add.text(28, cardY + 36, `¥${state.cash.toLocaleString()}`, {
      fontSize: '22px', color: '#e0e0e0', fontFamily: 'monospace',
    });
    // 昨日心情（第2天起显示）
    if (state.dailySnapshots.length > 0) {
      const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
      const emoji = getMoodEmoji(lastSnap.mood);
      this.add.text(GAME_WIDTH - 28, cardY + 30, emoji, {
        fontSize: '36px',
      }).setOrigin(1, 0.5);
    }

    // 大盘简报
    const briefY = cardY + 96;
    this.add.rectangle(16, briefY, GAME_WIDTH - 32, 60, 0x1e1e3a, 1)
      .setOrigin(0, 0).setStrokeStyle(1, 0x333366);
    this.add.text(28, briefY + 8, '📰 今日市场概览', {
      fontSize: '13px', color: '#4a90d9', fontFamily: 'sans-serif',
    });

    // 获取今日行情数据生成简报
    const stockIds = gm.stocks.getStockIds();
    const todayData: Record<string, DailyStockData> = {};
    for (const id of stockIds) {
      todayData[id] = gm.stocks.getDailyData(id, day);
    }
    const brief = generateDailyBrief(todayData);
    this.add.text(28, briefY + 32, brief.summary, {
      fontSize: '14px', color: '#ccc', fontFamily: 'sans-serif',
    });

    // 股票昨收列表（简化版）
    const listY = briefY + 80;
    this.add.text(16, listY, '📊 推荐关注', {
      fontSize: '14px', color: '#ffd700', fontFamily: 'sans-serif',
    });

    const recommended = stockIds.filter(id => gm.stocks.isRecommended(id));
    recommended.forEach((id, i) => {
      const dd = todayData[id];
      const prevClose = day > 0 ? gm.stocks.getClosePrice(id, day - 1) : dd.open;
      const change = ((dd.open - prevClose) / prevClose * 100).toFixed(2);
      const color = dd.open >= prevClose ? '#e74c3c' : '#2ecc71';
      const sign = dd.open >= prevClose ? '+' : '';
      const y = listY + 28 + i * 32;
      this.add.text(28, y, `⭐ ${id}`, {
        fontSize: '14px', color: '#e0e0e0', fontFamily: 'sans-serif',
      });
      this.add.text(GAME_WIDTH - 28, y, `¥${dd.open.toFixed(2)}  ${sign}${change}%`, {
        fontSize: '13px', color, fontFamily: 'monospace',
      }).setOrigin(1, 0);
    });

    // 底部按钮
    const btnY = GAME_HEIGHT - 100;
    const tradeBg = this.add.rectangle(GAME_WIDTH / 2, btnY, GAME_WIDTH - 40, 48, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, btnY, '📈 进入盘中交易', {
      fontSize: '17px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    tradeBg.on('pointerup', () => {
      gm.state.setPhase('trading');
      this.scene.start('TradingScene');
    });

    const skipBg = this.add.rectangle(GAME_WIDTH / 2, btnY + 56, GAME_WIDTH - 40, 40, 0x333366, 0.8)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, btnY + 56, '⏭️ 不看盘，直接进入盘后', {
      fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    skipBg.on('pointerup', () => {
      gm.state.setPhase('post-market');
      this.scene.start('PostMarketScene');
    });
  }
}
