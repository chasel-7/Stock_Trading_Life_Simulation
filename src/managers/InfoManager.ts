import type { InfoItem } from '../models/types';

export interface ChainVerdict {
  stockId: string;
  sources: string[];
  combinedAccuracy: number;
  verdict: string;
  details: string[];
}

export class InfoManager {
  private infoList: InfoItem[] = [];
  private stockIds: string[];

  constructor(stockIds: string[]) {
    this.stockIds = stockIds;
  }

  /** 生成一条信息（随机选股） */
  generateInfo(source: string, accuracy: number, day: number): InfoItem | null {
    if (this.stockIds.length === 0) return null;
    const stockId = this.stockIds[Math.floor(Math.random() * this.stockIds.length)];
    const content = this.generateContent(stockId, accuracy);
    return { stockId, source, content, accuracy, day };
  }

  addInfo(info: InfoItem): void {
    this.infoList.push(info);
  }

  /** 检查是否触发情报串联（2+不同来源） */
  checkChain(stockId: string): boolean {
    const sources = new Set(
      this.infoList.filter(i => i.stockId === stockId).map(i => i.source)
    );
    return sources.size >= 2;
  }

  /** 生成情报串联综合研判 */
  generateChainVerdict(stockId: string): ChainVerdict | null {
    const infos = this.infoList.filter(i => i.stockId === stockId);
    const sources = new Set(infos.map(i => i.source));
    if (sources.size < 2) return null;

    const avgAccuracy = infos.reduce((a, b) => a + b.accuracy, 0) / infos.length;
    const combinedAccuracy = Math.min(0.9, avgAccuracy + sources.size * 0.15);

    const details = infos.map(i => `[${i.source}] ${i.content}`);

    const verdictTemplates = [
      `多源验证：${stockId} 短期走势偏多，建议重点关注`,
      `交叉确认：${stockId} 近期可能有较大波动，注意风险与机会`,
      `情报汇总：${stockId} 基本面和消息面均指向同一方向`,
      `综合研判：${stockId} 的多条信息相互印证，确信度较高`,
    ];
    const verdict = verdictTemplates[Math.floor(Math.random() * verdictTemplates.length)];

    return { stockId, sources: Array.from(sources), combinedAccuracy, verdict, details };
  }

  getInfoForStock(stockId: string): InfoItem[] {
    return this.infoList.filter(i => i.stockId === stockId);
  }

  getAllInfo(): InfoItem[] {
    return [...this.infoList];
  }

  private generateContent(_stockId: string, _accuracy: number): string {
    const templates = [
      `${_stockId} 近期可能有异动`,
      `有消息称 ${_stockId} 走势偏多`,
      `${_stockId} 基本面有变化`,
      `注意 ${_stockId} 的量能变化`,
      `${_stockId} 可能迎来拐点`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

