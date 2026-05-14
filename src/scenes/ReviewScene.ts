import Phaser from 'phaser';
import { getGameManager } from '../managers/GameManager';
import { getCharacter } from '../data/characters';
import { detectBiases } from '../utils/biasDetector';
import { calculateScores, generateTitle, type ScoreResult, type TitleResult } from '../utils/scoring';
import { AssetCurveChart } from '../ui/AssetCurveChart';
import { RadarChart } from '../ui/RadarChart';
import { generatePoster, type PosterData } from '../utils/posterGenerator';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class ReviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReviewScene' });
  }

  create(): void {
    this.showReveal();
  }

  /** Step 1: 揭开面纱 — 揭示每支股票最终涨跌 */
  private showReveal(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const stockIds = gm.stocks.getStockIds();
    const totalDays = gm.stocks.getTotalDays();

    this.add.text(GAME_WIDTH / 2, 30, '🎭 揭开面纱', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, '这些股票的真实身份是...', {
      fontSize: '13px', color: '#888', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 逐个显示股票最终涨跌
    const startY = 90;
    stockIds.forEach((id, i) => {
      const y = startY + i * 36;
      const container = this.add.container(0, 0).setAlpha(0);
      const lastDay = totalDays - 1;
      const finalPrice = gm.stocks.getClosePrice(id, lastDay);
      const openPrice = gm.stocks.getDailyData(id, 0).open;
      const totalChange = ((finalPrice - openPrice) / openPrice * 100).toFixed(1);
      const color = finalPrice >= openPrice ? '#e74c3c' : '#2ecc71';
      const sign = finalPrice >= openPrice ? '+' : '';

      container.add(this.add.text(28, y, id, {
        fontSize: '14px', color: '#e0e0e0', fontFamily: 'sans-serif',
      }));
      container.add(this.add.text(GAME_WIDTH - 28, y, `${sign}${totalChange}%`, {
        fontSize: '14px', color, fontFamily: 'monospace',
      }).setOrigin(1, 0));

      this.tweens.add({
        targets: container,
        alpha: 1,
        delay: i * 150,
        duration: 300,
      });
    });

    // 下一步按钮
    const btnDelay = stockIds.length * 150 + 500;
    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true }).setAlpha(0);
    const btnTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '📊 数据复盘 →', {
      fontSize: '15px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [btn, btnTxt], alpha: 1, delay: btnDelay, duration: 300 });
    btn.on('pointerup', () => this.showChart());
  }

  /** Step 2: 数据复盘 — 资产曲线图 + 关键数据 */
  private showChart(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const state = gm.state.getState();

    this.add.text(GAME_WIDTH / 2, 30, '📊 数据复盘', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 资产曲线
    new AssetCurveChart(this, 16, 60, GAME_WIDTH - 32, 220, state.dailySnapshots, state.startingCash);

    // 关键数据
    const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
    const totalReturn = lastSnap
      ? ((lastSnap.totalAssets - state.startingCash) / state.startingCash * 100).toFixed(1)
      : '0.0';
    const retColor = parseFloat(totalReturn) >= 0 ? '#e74c3c' : '#2ecc71';
    const retSign = parseFloat(totalReturn) >= 0 ? '+' : '';

    this.add.text(GAME_WIDTH / 2, 300, `总收益率: ${retSign}${totalReturn}%`, {
      fontSize: '24px', color: retColor, fontFamily: 'monospace',
    }).setOrigin(0.5);

    const trades = gm.tradeLog.totalTrades();
    this.add.text(GAME_WIDTH / 2, 340, `总交易次数: ${trades}`, {
      fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 最终资产
    if (lastSnap) {
      this.add.text(GAME_WIDTH / 2, 370, `最终资产: ¥${lastSnap.totalAssets.toLocaleString()}`, {
        fontSize: '14px', color: '#ffd700', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🧠 认知偏差 →', {
      fontSize: '15px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.showBias());
  }

  /** Step 3: 认知偏差诊断 */
  private showBias(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const state = gm.state.getState();
    const biases = detectBiases(gm.tradeLog.getAll(), state.dailySnapshots, [], state.currentDay);

    this.add.text(GAME_WIDTH / 2, 30, '🧠 认知偏差诊断', {
      fontSize: '22px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    if (biases.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '🎉 未检测到明显偏差', {
        fontSize: '18px', color: '#2ecc71', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '你的交易行为相当理性！', {
        fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    } else {
      let y = 80;
      biases.forEach((b, i) => {
        const container = this.add.container(0, 0).setAlpha(0);
        container.add(this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 32, 90, 0x1e1e3a, 1)
          .setStrokeStyle(1, 0x333366));
        container.add(this.add.text(28, y - 28, `${b.emoji} ${b.name}`, {
          fontSize: '16px', color: '#e74c3c', fontFamily: 'sans-serif',
        }));
        container.add(this.add.text(28, y - 4, b.description, {
          fontSize: '12px', color: '#ccc', fontFamily: 'sans-serif',
          wordWrap: { width: GAME_WIDTH - 56 },
        }));
        container.add(this.add.text(28, y + 20, `💡 ${b.advice}`, {
          fontSize: '11px', color: '#4a90d9', fontFamily: 'sans-serif',
          wordWrap: { width: GAME_WIDTH - 56 },
        }));
        this.tweens.add({ targets: container, alpha: 1, delay: i * 300, duration: 400 });
        y += 110;
      });
    }

    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44, 0x4a90d9, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '⭐ 查看评分 →', {
      fontSize: '15px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btn.on('pointerup', () => this.showScore());
  }

  /** Step 4: 评分 + 称号 + 分享 */
  private showScore(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const state = gm.state.getState();
    const char = getCharacter(state.characterId);
    const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
    const biases = detectBiases(gm.tradeLog.getAll(), state.dailySnapshots, [], state.currentDay);

    const totalReturn = lastSnap ? (lastSnap.totalAssets - state.startingCash) / state.startingCash : 0;

    const scores: ScoreResult = calculateScores({
      totalReturn,
      biasCount: biases.length,
      avgBiasSeverity: biases.length > 0 ? biases.reduce((a, b) => a + b.severity, 0) / biases.length : 0,
      totalInfoCollected: gm.info.getAllInfo().length,
      infoActedUpon: Math.min(gm.info.getAllInfo().length, gm.tradeLog.totalTrades()),
      totalSceneSpending: 0, // 简化：无场景消费记录
      totalSalaryEarned: state.currentDay * (typeof char.dailySalary === 'number' ? char.dailySalary : ((char.dailySalary[0] + char.dailySalary[1]) / 2)),
      moodVariance: this.calcMoodVariance(state.dailySnapshots),
      daysPlayed: state.currentDay - 1,
    });

    const titleResult: TitleResult = generateTitle(scores);

    // 称号（动画入场）
    const emojiTxt = this.add.text(GAME_WIDTH / 2, 40, titleResult.emoji, { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);
    const titleTxt = this.add.text(GAME_WIDTH / 2, 96, titleResult.title, {
      fontSize: '26px', color: '#ffd700', fontFamily: 'sans-serif',
    }).setOrigin(0.5).setAlpha(0);
    const summaryTxt = this.add.text(GAME_WIDTH / 2, 130, titleResult.summary, {
      fontSize: '13px', color: '#aaa', fontFamily: 'sans-serif',
      wordWrap: { width: GAME_WIDTH - 48 }, align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({ targets: emojiTxt, alpha: 1, y: 40, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: titleTxt, alpha: 1, delay: 200, duration: 400 });
    this.tweens.add({ targets: summaryTxt, alpha: 1, delay: 400, duration: 400 });

    // 雷达图（延迟出现）
    this.time.delayedCall(600, () => {
      new RadarChart(this, GAME_WIDTH / 2, 310, 90, scores);
    });

    // 分享海报按钮
    const shareBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 40, 44, 0xf39c12, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, '📤 生成分享海报', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    shareBg.on('pointerup', () => {
      const posterData: PosterData = {
        characterName: char.name,
        characterEmoji: char.emoji,
        totalReturn,
        title: titleResult.title,
        scores,
        topBias: biases.length > 0 ? biases[0] : null,
        daysPlayed: state.currentDay - 1,
      };
      generatePoster(this, posterData);
    });

    // 再来一局
    const replayBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 40, 44, 0x27ae60, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '🎮 再来一局', {
      fontSize: '16px', color: '#fff', fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    replayBg.on('pointerup', () => this.scene.start('BootScene'));
  }

  private calcMoodVariance(snapshots: { dailyReturn: number }[]): number {
    if (snapshots.length < 2) return 0;
    const returns = snapshots.map(s => s.dailyReturn);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
  }
}
