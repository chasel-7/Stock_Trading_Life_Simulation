import type { InfoItem } from '../models/types';

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
