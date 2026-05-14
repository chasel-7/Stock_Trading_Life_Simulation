import type { DailyStockData } from '../models/types';

export interface DailyBrief {
  trend: '偏多' | '偏空' | '震荡';
  activeSectors: string[];
  summary: string;
}

export function generateDailyBrief(
  stocksData: Record<string, DailyStockData>,
): DailyBrief {
  // 计算各板块平均涨跌幅
  const sectorChanges: Record<string, number[]> = {};
  let totalChange = 0;
  let count = 0;

  for (const [id, data] of Object.entries(stocksData)) {
    const sector = id.split('-')[0];
    const change = (data.close - data.open) / data.open;
    if (!sectorChanges[sector]) sectorChanges[sector] = [];
    sectorChanges[sector].push(change);
    totalChange += change;
    count++;
  }

  const avgChange = count > 0 ? totalChange / count : 0;
  const trend: DailyBrief['trend'] =
    avgChange > 0.01 ? '偏多' : avgChange < -0.01 ? '偏空' : '震荡';

  // 找活跃板块（平均涨幅最高的板块）
  const sectorAvg: { sector: string; avg: number }[] = [];
  for (const [sector, changes] of Object.entries(sectorChanges)) {
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
    sectorAvg.push({ sector, avg });
  }
  sectorAvg.sort((a, b) => Math.abs(b.avg) - Math.abs(a.avg));
  const activeSectors = sectorAvg.slice(0, 2).map(s => s.sector);

  const summary = `大盘趋势：${trend} | 活跃板块：${activeSectors.join('、')}`;

  return { trend, activeSectors, summary };
}
