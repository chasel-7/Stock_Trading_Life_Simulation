import Phaser from 'phaser';
import type { ScoreResult } from './scoring';
import type { BiasResult } from './biasDetector';

export interface PosterData {
  characterName: string;
  characterEmoji: string;
  totalReturn: number;       // 总收益率（小数）
  title: string;             // 称号
  scores: ScoreResult;
  topBias: BiasResult | null;
  daysPlayed: number;
}

/** 在当前scene中绘制海报内容，然后截图导出 */
export function generatePoster(scene: Phaser.Scene, data: PosterData): void {
  const { width } = scene.scale;
  const posterH = 520;
  const posterW = width - 40;
  const container = scene.add.container(20, 100);

  // 背景
  const bg = scene.add.graphics();
  bg.fillStyle(0x0f0f23, 1);
  bg.fillRoundedRect(0, 0, posterW, posterH, 16);
  bg.lineStyle(2, 0x4a90d9, 0.8);
  bg.strokeRoundedRect(0, 0, posterW, posterH, 16);
  container.add(bg);

  // 标题
  container.add(scene.add.text(posterW / 2, 24, '📊 股票人生模拟器', {
    fontSize: '18px', color: '#ffd700', fontFamily: 'sans-serif',
  }).setOrigin(0.5));

  // 角色+称号
  container.add(scene.add.text(posterW / 2, 56, `${data.characterEmoji} ${data.characterName}`, {
    fontSize: '16px', color: '#e0e0e0', fontFamily: 'sans-serif',
  }).setOrigin(0.5));

  container.add(scene.add.text(posterW / 2, 84, `🏆 ${data.title}`, {
    fontSize: '20px', color: '#4a90d9', fontFamily: 'sans-serif',
  }).setOrigin(0.5));

  // 收益率
  const returnColor = data.totalReturn >= 0 ? '#e74c3c' : '#27ae60';
  const returnSign = data.totalReturn >= 0 ? '+' : '';
  container.add(scene.add.text(posterW / 2, 120, `${returnSign}${(data.totalReturn * 100).toFixed(1)}%`, {
    fontSize: '36px', color: returnColor, fontFamily: 'monospace',
  }).setOrigin(0.5));

  container.add(scene.add.text(posterW / 2, 160, `${data.daysPlayed}天交易生涯`, {
    fontSize: '13px', color: '#888', fontFamily: 'sans-serif',
  }).setOrigin(0.5));

  // 四维评分
  const scoreLabels = [
    `投资智慧 ${data.scores.investWisdom}`,
    `社交回报 ${data.scores.socialReturn}`,
    `生活平衡 ${data.scores.lifeBalance}`,
    `心态稳定 ${data.scores.mentalStability}`,
  ];
  scoreLabels.forEach((s, i) => {
    container.add(scene.add.text(24 + (i % 2) * (posterW / 2), 200 + Math.floor(i / 2) * 28, s, {
      fontSize: '14px', color: '#aaa', fontFamily: 'sans-serif',
    }));
  });

  // 最突出的认知偏差
  if (data.topBias) {
    container.add(scene.add.text(posterW / 2, 280, `${data.topBias.emoji} 我的最大弱点：${data.topBias.name}`, {
      fontSize: '14px', color: '#f39c12', fontFamily: 'sans-serif',
    }).setOrigin(0.5));
  }

  // 水印
  container.add(scene.add.text(posterW / 2, posterH - 24, '扫码挑战 → stock-life.app', {
    fontSize: '11px', color: '#555', fontFamily: 'sans-serif',
  }).setOrigin(0.5));

  // 截图并触发下载/分享
  scene.time.delayedCall(100, () => {
    scene.game.renderer.snapshot((image: Phaser.Display.Color | HTMLImageElement) => {
      const img = image as HTMLImageElement;
      // 尝试 Web Share API (移动端微信等)
      if (navigator.share) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'stock-life-result.png', { type: 'image/png' });
          try {
            await navigator.share({ files: [file], title: '我的股票人生' });
          } catch {
            downloadImage(img);
          }
        }, 'image/png');
      } else {
        downloadImage(img);
      }
      container.destroy();
    });
  });
}

function downloadImage(img: HTMLImageElement): void {
  const link = document.createElement('a');
  link.href = img.src;
  link.download = 'stock-life-result.png';
  link.click();
}
