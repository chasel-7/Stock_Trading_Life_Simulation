export class PriceTickEngine {
  private ticks: Record<string, number[]>;
  private currentIndex = -1;
  private maxIndex: number;
  private listeners: ((stockId: string, price: number, tickIndex: number) => void)[] = [];
  private onFinishCb: (() => void) | null = null;
  private prices: Record<string, number> = {};

  constructor(ticksByStock: Record<string, number[]>) {
    this.ticks = ticksByStock;
    const lengths = Object.values(ticksByStock).map(t => t.length);
    this.maxIndex = Math.max(...lengths) - 1;
  }

  onTick(cb: (stockId: string, price: number, tickIndex: number) => void): void {
    this.listeners.push(cb);
  }

  onFinish(cb: () => void): void {
    this.onFinishCb = cb;
  }

  step(): void {
    this.currentIndex++;
    for (const [stockId, tickArr] of Object.entries(this.ticks)) {
      const idx = Math.min(this.currentIndex, tickArr.length - 1);
      const price = tickArr[idx];
      this.prices[stockId] = price;
      for (const cb of this.listeners) {
        cb(stockId, price, this.currentIndex);
      }
    }
    if (this.isFinished() && this.onFinishCb) {
      this.onFinishCb();
    }
  }

  isFinished(): boolean {
    return this.currentIndex >= this.maxIndex;
  }

  getCurrentPrices(): Record<string, number> {
    return { ...this.prices };
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  reset(): void {
    this.currentIndex = -1;
    this.prices = {};
  }
}
