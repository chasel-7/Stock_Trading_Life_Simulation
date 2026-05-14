import type { SceneConfig, SceneEvent } from '../models/sceneTypes';
import { MoodLevel } from '../config/constants';

export const SCENE_CONFIGS: SceneConfig[] = [
  {
    id: 'home',
    name: '回家吃泡面',
    emoji: '🏠',
    cost: 0,
    minMood: MoodLevel.DEVASTATED,
    infoDescription: '无',
    infoAccuracy: -1,
  },
  {
    id: 'food-stall',
    name: '大排档',
    emoji: '🍜',
    cost: 200,
    minMood: MoodLevel.SAD,
    infoDescription: '遇到老股民吹牛，某股趋势方向',
    infoAccuracy: 0.6,
  },
  {
    id: 'bar',
    name: '酒吧',
    emoji: '🍺',
    cost: 300,
    minMood: MoodLevel.HAPPY,
    infoDescription: '搭讪到券商销售，某股涨跌预测',
    infoAccuracy: 0.5,
  },
  // === 免费场景 ===
  {
    id: 'park',
    name: '公园散步',
    emoji: '🌳',
    cost: 0,
    minMood: MoodLevel.DEVASTATED,
    infoDescription: '无',
    infoAccuracy: -1,
  },
  {
    id: 'phone',
    name: '刷手机',
    emoji: '📱',
    cost: 0,
    minMood: MoodLevel.DEVASTATED,
    infoDescription: '社交媒体上的股市讨论，噪音大',
    infoAccuracy: 0.2,
  },
  // === 付费场景 ===
  {
    id: 'bookstore',
    name: '书店',
    emoji: '📚',
    cost: 100,
    minMood: MoodLevel.SAD,
    infoDescription: '翻阅投资书籍，手续费减半3天',
    infoAccuracy: -1,
  },
  {
    id: 'convenience',
    name: '便利店',
    emoji: '🏪',
    cost: 50,
    minMood: MoodLevel.SAD,
    infoDescription: '店员闲聊，偶尔听到行业消息',
    infoAccuracy: 0.3,
  },
  {
    id: 'restaurant',
    name: '高级餐厅',
    emoji: '🍽️',
    cost: 800,
    minMood: MoodLevel.HAPPY,
    infoDescription: '遇到行业高管，高质量信息',
    infoAccuracy: 0.8,
  },
  {
    id: 'ktv',
    name: 'KTV包场',
    emoji: '🎤',
    cost: 1500,
    minMood: MoodLevel.EUPHORIC,
    infoDescription: '酒后吐真言，某股内幕方向',
    infoAccuracy: 0.7,
  },
  {
    id: 'spa',
    name: 'SPA会所',
    emoji: '💆',
    cost: 2000,
    minMood: MoodLevel.EUPHORIC,
    infoDescription: '富豪圈子，极高质量但可能误导',
    infoAccuracy: 0.85,
  },
];

export const SCENE_EVENTS: SceneEvent[] = [
  // === 回家 ===
  {
    id: 'home-01', sceneId: 'home',
    description: '泡面泡好了，刷手机看到一条股市新闻', emoji: '📱',
    optionA: { label: '认真看看', cost: 0, infoReward: true, infoAccuracy: 0.3, infoContent: '某板块可能有异动' },
    optionB: { label: '关掉手机早点睡', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '好好休息，明天精力充沛' },
  },
  {
    id: 'home-02', sceneId: 'home',
    description: '室友/家人问你今天股市怎么样', emoji: '💬',
    optionA: { label: '聊聊今天的操作', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '倾诉减压' },
    optionB: { label: '不想提这事', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === 大排档 ===
  {
    id: 'stall-01', sceneId: 'food-stall',
    description: '邻桌老股民正在侃大山', emoji: '👴',
    optionA: { label: '请他喝瓶啤酒 ¥30', cost: 30, infoReward: true, infoAccuracy: 0.6, infoContent: '某股近期走势方向' },
    optionB: { label: '听听就好', cost: 0, infoReward: true, infoAccuracy: 0.3, infoContent: '模糊的市场感觉' },
  },
  {
    id: 'stall-02', sceneId: 'food-stall',
    description: '朋友发来一条荐股消息', emoji: '📱',
    optionA: { label: '信了，记下来', cost: 0, infoReward: true, infoAccuracy: 0.5, infoContent: '朋友推荐的股票' },
    optionB: { label: '无视，继续吃饭', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  {
    id: 'stall-03', sceneId: 'food-stall',
    description: '遇到前同事，他现在在券商工作', emoji: '🤝',
    optionA: { label: '请他吃顿好的 ¥100', cost: 100, infoReward: true, infoAccuracy: 0.7, infoContent: '行业内部信息' },
    optionB: { label: '随便聊聊', cost: 0, infoReward: true, infoAccuracy: 0.4, infoContent: '一条行业八卦' },
  },
  // === 酒吧 ===
  {
    id: 'bar-01', sceneId: 'bar',
    description: '有人请你喝酒套近乎', emoji: '🍺',
    optionA: { label: '喝一杯 ¥200', cost: 200, infoReward: true, infoAccuracy: 0.5, infoContent: '一条来路不明的消息' },
    optionB: { label: '礼貌拒绝', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  {
    id: 'bar-02', sceneId: 'bar',
    description: '老板打电话来了', emoji: '📞',
    optionA: { label: '接听，答应明天加班', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '明天双倍日薪，但无盘后社交' },
    optionB: { label: '挂断，继续喝', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '老板不太高兴' },
  },
  {
    id: 'bar-03', sceneId: 'bar',
    description: '遇到一个自称券商销售的人', emoji: '👔',
    optionA: { label: '请他喝两杯 ¥150', cost: 150, infoReward: true, infoAccuracy: 0.5, infoContent: '某股涨跌预测' },
    optionB: { label: '保持距离', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === 公园 ===
  {
    id: 'park-01', sceneId: 'park',
    description: '遇到退休老大爷在练太极', emoji: '🧘',
    optionA: { label: '聊几句', cost: 0, infoReward: true, infoAccuracy: 0.2, infoContent: '老大爷的股市哲学' },
    optionB: { label: '安静散步', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '心情恢复' },
  },
  {
    id: 'park-02', sceneId: 'park',
    description: '公园长椅上有人丢了一本财经杂志', emoji: '📰',
    optionA: { label: '翻翻看', cost: 0, infoReward: true, infoAccuracy: 0.4, infoContent: '过期但有参考价值的分析' },
    optionB: { label: '不看了', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === 刷手机 ===
  {
    id: 'phone-01', sceneId: 'phone',
    description: '刷到一条热搜：某行业政策利好', emoji: '🔥',
    optionA: { label: '深入研究', cost: 0, infoReward: true, infoAccuracy: 0.3, infoContent: '热搜板块方向' },
    optionB: { label: '可能是炒作', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  {
    id: 'phone-02', sceneId: 'phone',
    description: '股吧里有人晒出重仓某股的截图', emoji: '💰',
    optionA: { label: '跟风记下来', cost: 0, infoReward: true, infoAccuracy: 0.15, infoContent: '网友推荐（噪音极大）' },
    optionB: { label: '关闭APP', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '避免信息过载' },
  },
  // === 书店 ===
  {
    id: 'book-01', sceneId: 'bookstore',
    description: '看到一本《聪明的投资者》', emoji: '📖',
    optionA: { label: '买下来 ¥60', cost: 60, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半3天' },
    optionB: { label: '站着翻翻', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半1天' },
  },
  {
    id: 'book-02', sceneId: 'bookstore',
    description: '偶遇一位财经作家在签售', emoji: '✍️',
    optionA: { label: '排队签名聊两句 ¥80', cost: 80, infoReward: true, infoAccuracy: 0.6, infoContent: '作家对某板块的见解' },
    optionB: { label: '远远看看就好', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === 便利店 ===
  {
    id: 'conv-01', sceneId: 'convenience',
    description: '店员在讨论最近某公司的产品卖爆了', emoji: '🛒',
    optionA: { label: '搭话问问', cost: 0, infoReward: true, infoAccuracy: 0.4, infoContent: '消费端的销售线索' },
    optionB: { label: '买完就走', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === 高级餐厅 ===
  {
    id: 'rest-01', sceneId: 'restaurant',
    description: '邻桌是两个穿西装的人在谈收购', emoji: '🤵',
    optionA: { label: '竖起耳朵偷听', cost: 0, infoReward: true, infoAccuracy: 0.75, infoContent: '某公司重组信号' },
    optionB: { label: '专心吃饭', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  {
    id: 'rest-02', sceneId: 'restaurant',
    description: '服务员推荐了一瓶好酒', emoji: '🍷',
    optionA: { label: '来一瓶 ¥500', cost: 500, infoReward: false, infoAccuracy: 0, specialEffect: '心情大好，明天解锁高级场景' },
    optionB: { label: '不用了', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  // === KTV ===
  {
    id: 'ktv-01', sceneId: 'ktv',
    description: '包厢里有个基金经理喝多了', emoji: '🎤',
    optionA: { label: '陪他唱一首', cost: 0, infoReward: true, infoAccuracy: 0.7, infoContent: '基金经理酒后吐的真言' },
    optionB: { label: '自己唱自己的', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
  {
    id: 'ktv-02', sceneId: 'ktv',
    description: '有人提议AA再续一场', emoji: '💸',
    optionA: { label: '加入 ¥300', cost: 300, infoReward: true, infoAccuracy: 0.65, infoContent: '深夜圈子里的内部消息' },
    optionB: { label: '先撤了', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '保存体力' },
  },
  // === SPA ===
  {
    id: 'spa-01', sceneId: 'spa',
    description: '隔壁VIP房间传来私募老板的电话声', emoji: '📞',
    optionA: { label: '凑近听', cost: 0, infoReward: true, infoAccuracy: 0.85, infoContent: '私募重仓方向' },
    optionB: { label: '享受按摩', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '全面放松，心情大幅提升' },
  },
  {
    id: 'spa-02', sceneId: 'spa',
    description: '遇到一位上市公司董秘在泡池', emoji: '♨️',
    optionA: { label: '搭话 ¥200小费给技师制造机会', cost: 200, infoReward: true, infoAccuracy: 0.9, infoContent: '公司近期动向' },
    optionB: { label: '保持低调', cost: 0, infoReward: false, infoAccuracy: 0 },
  },
];

/** 获取指定心情可解锁的场景 */
export function getUnlockedScenes(mood: MoodLevel): SceneConfig[] {
  const moodOrder = [
    MoodLevel.DEVASTATED,
    MoodLevel.SAD,
    MoodLevel.NEUTRAL,
    MoodLevel.HAPPY,
    MoodLevel.EUPHORIC,
  ];
  const moodIdx = moodOrder.indexOf(mood);
  return SCENE_CONFIGS.filter(s => {
    const sceneIdx = moodOrder.indexOf(s.minMood);
    return sceneIdx <= moodIdx;
  });
}

/** 获取指定场景的随机事件（抽1~2个） */
export function getRandomEvents(sceneId: string, count: number = 2): SceneEvent[] {
  const pool = SCENE_EVENTS.filter(e => e.sceneId === sceneId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}
