import Phaser from 'phaser';
import { THEME } from '../ui/theme';
import { CardFactory } from '../ui/CardFactory';
import { Transition } from '../ui/Transition';
import { getGameManager } from '../managers/GameManager';
import { getCharacter } from '../data/characters';
import { detectBiases } from '../utils/biasDetector';
import { calculateScores, generateTitle, type ScoreResult, type TitleResult } from '../utils/scoring';
import { AssetCurveChart } from '../ui/AssetCurveChart';
import { RadarChart } from '../ui/RadarChart';
import { generatePoster, type PosterData } from '../utils/posterGenerator';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class ReviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ReviewScene' });
  }

  create(): void {
    Transition.fadeIn(this);
    this.showReveal();
  }

  /** Step 1: 揭开面纱 — 揭示每支股票最终涨跌 */
  private showReveal(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const stockIds = gm.stocks.getStockIds();
    const totalDays = gm.stocks.getTotalDays();

    this.add.text(GAME_WIDTH / 2, 30, '🎭 揭开面纱', {
      fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, '这些股票的真实身份是...', {
      fontSize: '13px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
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
      const color = finalPrice >= openPrice ? THEME.colors.rise : THEME.colors.fall;
      const sign = finalPrice >= openPrice ? '+' : '';

      container.add(this.add.text(28, y, id, {
        fontSize: '14px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
      }));
      container.add(this.add.text(GAME_WIDTH - 28, y, `${sign}${totalChange}%`, {
        fontSize: '14px', color, fontFamily: THEME.font.mono,
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
    const btn = CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44,
      '📊 数据复盘 →', {
        onClick: () => this.showChart(),
      },
    ).setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, delay: btnDelay, duration: 300 });
  }

  /** Step 2: 数据复盘 — 资产曲线图 + 关键数据 */
  private showChart(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const state = gm.state.getState();

    this.add.text(GAME_WIDTH / 2, 30, '📊 数据复盘', {
      fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    // 资产曲线
    new AssetCurveChart(this, 16, 60, GAME_WIDTH - 32, 220, state.dailySnapshots, state.startingCash);

    // 关键数据
    const lastSnap = state.dailySnapshots[state.dailySnapshots.length - 1];
    const totalReturn = lastSnap
      ? ((lastSnap.totalAssets - state.startingCash) / state.startingCash * 100).toFixed(1)
      : '0.0';
    const retColor = parseFloat(totalReturn) >= 0 ? THEME.colors.rise : THEME.colors.fall;
    const retSign = parseFloat(totalReturn) >= 0 ? '+' : '';

    this.add.text(GAME_WIDTH / 2, 300, `总收益率: ${retSign}${totalReturn}%`, {
      fontSize: '24px', color: retColor, fontFamily: THEME.font.mono,
    }).setOrigin(0.5);

    const trades = gm.tradeLog.totalTrades();
    this.add.text(GAME_WIDTH / 2, 340, `总交易次数: ${trades}`, {
      fontSize: '14px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    if (lastSnap) {
      this.add.text(GAME_WIDTH / 2, 370, `最终资产: ¥${lastSnap.totalAssets.toLocaleString()}`, {
        fontSize: '14px', color: '#ffd700', fontFamily: THEME.font.primary,
      }).setOrigin(0.5);
    }

    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44,
      '🧠 认知偏差 →', {
        onClick: () => this.showBias(),
      },
    );
  }

  /** Step 3: 认知偏差诊断 */
  private showBias(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

    const gm = getGameManager(this);
    const state = gm.state.getState();
    const biases = detectBiases(gm.tradeLog.getAll(), state.dailySnapshots, [], state.currentDay);

    this.add.text(GAME_WIDTH / 2, 30, '🧠 认知偏差诊断', {
      fontSize: '22px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5);

    if (biases.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '🎉 未检测到明显偏差', {
        fontSize: '18px', color: THEME.colors.fall, fontFamily: THEME.font.primary,
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '你的交易行为相当理性！', {
        fontSize: '14px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      }).setOrigin(0.5);
    } else {
      let y = 80;
      biases.forEach((b, i) => {
        const container = this.add.container(0, 0).setAlpha(0);
        const cardBg = CardFactory.create(this.scene.scene, GAME_WIDTH / 2 - (GAME_WIDTH - 32) / 2, y - 45, GAME_WIDTH - 32, 90);
        container.add(cardBg);
        container.add(this.add.text(28, y - 28, `${b.emoji} ${b.name}`, {
          fontSize: '16px', color: THEME.colors.rise, fontFamily: THEME.font.primary,
        }));
        container.add(this.add.text(28, y - 4, b.description, {
          fontSize: '12px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
          wordWrap: { width: GAME_WIDTH - 56 },
        }));
        container.add(this.add.text(28, y + 20, `💡 ${b.advice}`, {
          fontSize: '11px', color: '#6c5ce7', fontFamily: THEME.font.primary,
          wordWrap: { width: GAME_WIDTH - 56 },
        }));
        this.tweens.add({ targets: container, alpha: 1, delay: i * 300, duration: 400 });
        y += 110;
      });
    }

    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 200, 44,
      '⭐ 查看评分 →', {
        onClick: () => this.showScore(),
      },
    );
  }

  /** Step 4: 评分 + 称号 + 分享 */
  private showScore(): void {
    this.children.removeAll();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEME.colors.bgPrimary, 1).setOrigin(0, 0);

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
      totalSceneSpending: 0,
      totalSalaryEarned: state.currentDay * (typeof char.dailySalary === 'number' ? char.dailySalary : ((char.dailySalary[0] + char.dailySalary[1]) / 2)),
      moodVariance: this.calcMoodVariance(state.dailySnapshots),
      daysPlayed: state.currentDay - 1,
    });

    const titleResult: TitleResult = generateTitle(scores);

    // 自动提交排行榜
    const leaderboard = new LeaderboardManager();
    leaderboard.submit({
      playerName: char.name,
      characterId: char.id,
      characterEmoji: char.emoji,
      totalReturn,
      investWisdom: scores.investWisdom,
      socialROI: scores.socialReturn,
      overallScore: scores.investWisdom + scores.socialReturn + scores.lifeBalance + scores.mentalStability,
      title: titleResult.title,
    });

    // 称号（动画入场）
    const emojiTxt = this.add.text(GAME_WIDTH / 2, 40, titleResult.emoji, { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);
    const titleTxt = this.add.text(GAME_WIDTH / 2, 96, titleResult.title, {
      fontSize: '26px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5).setAlpha(0);
    const summaryTxt = this.add.text(GAME_WIDTH / 2, 130, titleResult.summary, {
      fontSize: '13px', color: THEME.colors.textSecondary, fontFamily: THEME.font.primary,
      wordWrap: { width: GAME_WIDTH - 48 }, align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({ targets: emojiTxt, alpha: 1, y: 40, duration: 500, ease: 'Back.easeOut' });
    this.tweens.add({ targets: titleTxt, alpha: 1, delay: 200, duration: 400 });
    this.tweens.add({ targets: summaryTxt, alpha: 1, delay: 400, duration: 400 });

    // 雷达图
    this.time.delayedCall(600, () => {
      new RadarChart(this, GAME_WIDTH / 2, 310, 90, scores);
    });

    // 分享海报按钮
    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 40, 44,
      '📤 生成分享海报', {
        color: 0xf39c12,
        onClick: () => {
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
        },
      },
    );

    // 再来一局
    CardFactory.createButton(
      this, GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 40, 44,
      '🎮 再来一局', {
        color: THEME.colors.positive,
        onClick: () => Transition.fadeToScene(this, 'BootScene'),
      },
    );
  }

  private calcMoodVariance(snapshots: { dailyReturn: number }[]): number {
    if (snapshots.length < 2) return 0;
    const returns = snapshots.map(s => s.dailyReturn);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
  }
}
