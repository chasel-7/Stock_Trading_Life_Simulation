import type { MoodLevel } from '../config/constants';

/** 场景定义 */
export interface SceneConfig {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  /** 需要的最低心情档位才可解锁 */
  minMood: MoodLevel;
  /** 信息质量描述 */
  infoDescription: string;
  /** 信息准确率 0~1, -1表示无信息 */
  infoAccuracy: number;
}

/** 场景内事件 */
export interface SceneEvent {
  id: string;
  sceneId: string;
  description: string;
  emoji: string;
  optionA: EventOption;
  optionB: EventOption;
}

export interface EventOption {
  label: string;
  cost: number;           // 花费（负数表示收入）
  infoReward: boolean;    // 是否获得信息
  infoAccuracy: number;   // 信息准确度 0~1
  infoContent?: string;   // 信息内容模板
  specialEffect?: string; // 特殊效果描述
}

/** 场景内事件结果 */
export interface EventResult {
  eventId: string;
  chosenOption: 'A' | 'B';
  cost: number;
  gotInfo: boolean;
  infoAccuracy: number;
  message: string;
}
