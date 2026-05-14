export interface LifeEvent {
  id: string;
  description: string;
  emoji: string;
  /** 事件类型: forced=强制扣款, choice=有选项 */
  type: 'forced' | 'choice';
  /** 强制扣款金额（type=forced时） */
  forcedCost?: number;
  /** 动态扣款公式类型 */
  dynamicCost?: 'percent-of-cash' | 'percent-of-loss';
  dynamicRate?: number;
  /** 选择型事件的选项 */
  optionA?: LifeEventOption;
  optionB?: LifeEventOption;
  /** 触发条件（可选） */
  trigger?: 'any' | 'big-loss';
  /** 特殊效果（非货币类） */
  specialEffect?: 'reduce-trading-ticks' | 'skip-post-market' | 'double-salary';
}

export interface LifeEventOption {
  label: string;
  cost: number | 'dynamic';
  dynamicRate?: number;
  effect: string;
  /** 延迟收益：几天后返还 */
  delayedReturn?: { days: number; multiplier: number };
}

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'broken-appliance',
    description: '家电坏了，必须修理',
    emoji: '🏠',
    type: 'forced',
    forcedCost: 2000,
    trigger: 'any',
  },
  {
    id: 'relative-borrow',
    description: '亲友来借钱',
    emoji: '👨‍👩‍👦',
    type: 'choice',
    trigger: 'any',
    optionA: {
      label: '借出现金的20%',
      cost: 'dynamic',
      dynamicRate: 0.2,
      effect: '10天后返还120%',
      delayedReturn: { days: 10, multiplier: 1.2 },
    },
    optionB: {
      label: '婉拒',
      cost: 0,
      effect: '失去一个潜在消息源',
    },
  },
  {
    id: 'spouse-lecture',
    description: '老婆/对象指教了一顿',
    emoji: '💍',
    type: 'forced',
    dynamicCost: 'percent-of-loss',
    dynamicRate: 0.2,
    trigger: 'big-loss',
  },
  {
    id: 'feeling-sick',
    description: '身体不太舒服，明天盘中时间减半',
    emoji: '🏥',
    type: 'forced',
    forcedCost: 0,
    specialEffect: 'reduce-trading-ticks',
    trigger: 'any',
  },
  {
    id: 'friend-treat',
    description: '朋友请客吃饭',
    emoji: '🎉',
    type: 'forced',
    forcedCost: 0,
    trigger: 'any',
  },
];
