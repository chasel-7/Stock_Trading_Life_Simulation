import type { LifeEvent } from '../data/lifeEvents';
import { LIFE_EVENTS } from '../data/lifeEvents';

export class LifeEventManager {
  private frequency: number;

  constructor(eventFrequency: number) {
    this.frequency = eventFrequency;
  }

  /** 掷骰决定今日触发哪些生活事件 */
  rollDailyEvents(isBigLoss: boolean): LifeEvent[] {
    // 基于泊松分布简化：frequency为平均次数
    const count = this.poissonRandom(this.frequency);
    if (count === 0) return [];

    // 过滤可用事件池
    const pool = LIFE_EVENTS.filter(e => {
      if (e.trigger === 'big-loss' && !isBigLoss) return false;
      return true;
    });

    if (pool.length === 0) return [];

    // 随机抽取
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, pool.length));
  }

  /** 计算事件的实际花费 */
  static calculateCost(event: LifeEvent, currentCash: number, dailyLoss: number): number {
    if (event.forcedCost !== undefined) return event.forcedCost;
    if (event.dynamicCost === 'percent-of-cash') {
      return Math.round(currentCash * (event.dynamicRate || 0));
    }
    if (event.dynamicCost === 'percent-of-loss') {
      return Math.round(Math.abs(dailyLoss) * (event.dynamicRate || 0));
    }
    return 0;
  }

  /** 计算选项A的花费（用于choice类型） */
  static calculateOptionACost(event: LifeEvent, currentCash: number): number {
    if (!event.optionA) return 0;
    if (event.optionA.cost === 'dynamic') {
      return Math.round(currentCash * (event.optionA.dynamicRate || 0));
    }
    return typeof event.optionA.cost === 'number' ? event.optionA.cost : 0;
  }

  private poissonRandom(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
}
