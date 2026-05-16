# 推荐股盘中高亮 + 场景事件池扩充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在盘中交易列表中为推荐股添加明显的视觉高亮标记；将场景事件池从当前每场景2-3个扩充到每场景4-5个，达到设计规格中"每个场景3~5个事件池"的目标。

**Architecture:** 推荐股高亮在 StockRow 组件中已有 `isRecommended` 字段传入，只需增强 UI 渲染。事件池扩充在 `src/data/scenes.ts` 的 `SCENE_EVENTS` 数组中追加新事件条目，无需修改任何逻辑代码。

**Tech Stack:** Phaser 3 + TypeScript

---

## File Structure

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/ui/StockRow.ts` | 自选股列表行组件 | MODIFY — 增加推荐股背景高亮+标签 |
| `src/data/scenes.ts` | 场景事件数据 | MODIFY — 追加约20个新事件 |

---

### Task 1: 推荐股盘中高亮增强

**Files:**
- Modify: `src/ui/StockRow.ts:18-56`

- [ ] **Step 1: 增强 StockRow 构造函数中的推荐股视觉**

当前实现只在名称前加了 `⭐ ` 前缀（L31），需要增加：
1. 背景色微调（金色底色）
2. 右侧添加"荐"标签

```typescript
// src/ui/StockRow.ts — constructor 中，在分隔线之前添加推荐股高亮

constructor(scene: Phaser.Scene, x: number, y: number, width: number, data: StockRowData) {
  super(scene, x, y);
  scene.add.existing(this);

  const ROW_H = 56;

  // 背景 — 推荐股使用金色微光底色
  const bgColor = data.isRecommended ? 0x2a2520 : THEME.colors.bgCard;
  this.bg = scene.add.rectangle(0, 0, width, ROW_H, bgColor, 0.8)
    .setOrigin(0, 0)
    .setInteractive({ useHandCursor: true });
  this.add(this.bg);

  // 推荐股左侧金色竖条
  if (data.isRecommended) {
    const accent = scene.add.rectangle(0, 0, 3, ROW_H, 0xffd700, 1).setOrigin(0, 0);
    this.add(accent);
  }

  // 推荐股标记
  const prefix = data.isRecommended ? '⭐ ' : '';

  // 股票名称
  const nameTxt = scene.add.text(12, ROW_H / 2, `${prefix}${data.name}`, {
    fontSize: '15px', color: THEME.colors.textPrimary, fontFamily: THEME.font.primary,
  }).setOrigin(0, 0.5);
  this.add(nameTxt);

  // 推荐股"荐"标签
  if (data.isRecommended) {
    const tagBg = scene.add.rectangle(nameTxt.x + nameTxt.width + 8, ROW_H / 2, 24, 16, 0xffd700, 0.2)
      .setOrigin(0, 0.5);
    const tagTxt = scene.add.text(nameTxt.x + nameTxt.width + 20, ROW_H / 2, '荐', {
      fontSize: '10px', color: '#ffd700', fontFamily: THEME.font.primary,
    }).setOrigin(0.5, 0.5);
    this.add(tagBg);
    this.add(tagTxt);
  }

  // 现价 (不变)
  this.priceTxt = scene.add.text(width - 120, ROW_H / 2, `¥${data.price.toFixed(2)}`, {
    fontSize: '16px', color: THEME.colors.textPrimary, fontFamily: THEME.font.mono,
  }).setOrigin(1, 0.5);
  this.add(this.priceTxt);

  // 涨跌幅 (不变)
  const changeColor = data.changePercent >= 0 ? THEME.colors.rise : THEME.colors.fall;
  const changeSign = data.changePercent >= 0 ? '+' : '';
  this.changeTxt = scene.add.text(width - 12, ROW_H / 2,
    `${changeSign}${data.changePercent.toFixed(2)}%`, {
    fontSize: '15px', color: changeColor, fontFamily: THEME.font.mono,
  }).setOrigin(1, 0.5);
  this.add(this.changeTxt);

  // 分隔线
  const line = scene.add.rectangle(0, ROW_H - 1, width, 1, THEME.colors.border, 0.5).setOrigin(0, 0);
  this.add(line);
}
```

- [ ] **Step 2: 更新 updatePrice 中的闪烁恢复颜色**

推荐股背景闪烁恢复时应恢复到金色底色：

```typescript
// src/ui/StockRow.ts — updatePrice() 方法，需要记录 isRecommended
// 在类中增加属性：
private isRecommendedStock = false;

// 在 constructor 中设置：
this.isRecommendedStock = data.isRecommended;

// 在 updatePrice 的闪烁恢复中修改：
if (this.flashTimer) this.flashTimer.destroy();
this.flashTimer = this.scene.time.delayedCall(600, () => {
  this.priceTxt.setColor(THEME.colors.textPrimary);
  this.priceTxt.setScale(1);
  const restoreBg = this.isRecommendedStock ? 0x2a2520 : THEME.colors.bgCard;
  this.bg.setFillStyle(restoreBg, 0.8);
});
```

- [ ] **Step 3: 手动验证**

启动 `npm run dev`，进入盘中交易：
1. 确认推荐股有金色左侧竖条
2. 确认推荐股名称旁有"荐"标签
3. 确认推荐股背景色与普通股不同
4. 确认价格闪烁后恢复到正确的背景色

- [ ] **Step 4: Commit**

```bash
git add src/ui/StockRow.ts
git commit -m "feat: enhance recommended stock visual highlight in trading list"
```

---

### Task 2: 扩充场景事件池 — 回家 & 公园 & 刷手机

**Files:**
- Modify: `src/data/scenes.ts` — 在 `SCENE_EVENTS` 数组中追加事件

- [ ] **Step 1: 为"回家吃泡面"场景追加2个事件（现有2个→4个）**

在 `SCENE_EVENTS` 数组中，`// === 回家 ===` 区块后追加：

```typescript
{
  id: 'home-03', sceneId: 'home',
  description: '翻出一本旧财报，是之前买的投资入门书', emoji: '📖',
  optionA: { label: '认真读一章', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半1天' },
  optionB: { label: '太累了，扔一边', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'home-04', sceneId: 'home',
  description: '外卖APP推送了一个限时折扣', emoji: '🛵',
  optionA: { label: '点一份犒劳自己 ¥40', cost: 40, infoReward: false, infoAccuracy: 0, specialEffect: '心情微微好转' },
  optionB: { label: '继续泡面，省钱', cost: 0, infoReward: false, infoAccuracy: 0 },
},
```

- [ ] **Step 2: 为"公园散步"场景追加2个事件（现有2个→4个）**

```typescript
{
  id: 'park-03', sceneId: 'park',
  description: '遇到遛狗的大姐，她老公是上市公司中层', emoji: '🐕',
  optionA: { label: '搭话聊两句', cost: 0, infoReward: true, infoAccuracy: 0.35, infoContent: '某公司内部管理变动' },
  optionB: { label: '默默走过', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'park-04', sceneId: 'park',
  description: '看到广场上有人在争论股市', emoji: '🗣️',
  optionA: { label: '凑过去听听', cost: 0, infoReward: true, infoAccuracy: 0.2, infoContent: '散户们的主流观点（可能是反指）' },
  optionB: { label: '这种信息没用', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '保持独立思考' },
},
```

- [ ] **Step 3: 为"刷手机"场景追加2个事件（现有2个→4个）**

```typescript
{
  id: 'phone-03', sceneId: 'phone',
  description: '收到券商APP推送的研报摘要', emoji: '📊',
  optionA: { label: '仔细阅读', cost: 0, infoReward: true, infoAccuracy: 0.45, infoContent: '某板块估值分析' },
  optionB: { label: '关掉推送', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'phone-04', sceneId: 'phone',
  description: '朋友圈有人晒出今天赚了5万', emoji: '💰',
  optionA: { label: '私聊问他买了什么', cost: 0, infoReward: true, infoAccuracy: 0.25, infoContent: '朋友的持仓（可能已经到顶了）' },
  optionB: { label: '保持冷静，人家晒的时候可能已经高点了', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '抵抗从众心理' },
},
```

- [ ] **Step 4: Commit**

```bash
git add src/data/scenes.ts
git commit -m "content: add 6 new scene events for home, park, phone scenes"
```

---

### Task 3: 扩充场景事件池 — 大排档 & 书店 & 便利店

**Files:**
- Modify: `src/data/scenes.ts`

- [ ] **Step 1: 为"大排档"追加2个事件（现有3个→5个）**

```typescript
{
  id: 'stall-04', sceneId: 'food-stall',
  description: '老板娘抱怨最近物价涨了不少', emoji: '👩‍🍳',
  optionA: { label: '顺着话题聊聊消费板块', cost: 0, infoReward: true, infoAccuracy: 0.45, infoContent: '消费端物价趋势感知' },
  optionB: { label: '专心吃饭', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'stall-05', sceneId: 'food-stall',
  description: '隔壁桌的人在讨论新能源车', emoji: '🚗',
  optionA: { label: '加入讨论 请一轮啤酒 ¥50', cost: 50, infoReward: true, infoAccuracy: 0.55, infoContent: '新能源产业链上下游动态' },
  optionB: { label: '只是听听', cost: 0, infoReward: true, infoAccuracy: 0.25, infoContent: '零碎的行业片段' },
},
```

- [ ] **Step 2: 为"书店"追加2个事件（现有2个→4个）**

```typescript
{
  id: 'book-03', sceneId: 'bookstore',
  description: '发现一本绝版的《股票大作手回忆录》', emoji: '📚',
  optionA: { label: '买下来 ¥120', cost: 120, infoReward: false, infoAccuracy: 0, specialEffect: '手续费减半3天' },
  optionB: { label: '拍照记下精华段落', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '获得一点投资哲学感悟' },
},
{
  id: 'book-04', sceneId: 'bookstore',
  description: '书架旁一个年轻人正在看财务报表分析', emoji: '🤓',
  optionA: { label: '交流一下 请他喝杯咖啡 ¥30', cost: 30, infoReward: true, infoAccuracy: 0.5, infoContent: '他研究的某支股票基本面' },
  optionB: { label: '各看各的', cost: 0, infoReward: false, infoAccuracy: 0 },
},
```

- [ ] **Step 3: 为"便利店"追加2个事件（现有1个→3个）**

```typescript
{
  id: 'conv-02', sceneId: 'convenience',
  description: '货架上某品牌新品铺了一整排', emoji: '🧴',
  optionA: { label: '拍照记下品牌，回去查查上市公司', cost: 0, infoReward: true, infoAccuracy: 0.35, infoContent: '消费品牌市场扩张信号' },
  optionB: { label: '买瓶水就走', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'conv-03', sceneId: 'convenience',
  description: '收银台旁的小电视在放财经新闻', emoji: '📺',
  optionA: { label: '站着看一会儿', cost: 0, infoReward: true, infoAccuracy: 0.4, infoContent: '当日财经要闻摘要' },
  optionB: { label: '赶紧回去休息', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '早点休息' },
},
```

- [ ] **Step 4: Commit**

```bash
git add src/data/scenes.ts
git commit -m "content: add 6 new events for food-stall, bookstore, convenience scenes"
```

---

### Task 4: 扩充场景事件池 — 酒吧 & 高级餐厅 & KTV & SPA

**Files:**
- Modify: `src/data/scenes.ts`

- [ ] **Step 1: 为"酒吧"追加2个事件（现有3个→5个）**

```typescript
{
  id: 'bar-04', sceneId: 'bar',
  description: '调酒师是个兼职炒股的，聊起了技术面', emoji: '🍸',
  optionA: { label: '请他调杯特饮 ¥80', cost: 80, infoReward: true, infoAccuracy: 0.4, infoContent: '某股技术形态分析' },
  optionB: { label: '喝自己的', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'bar-05', sceneId: 'bar',
  description: '角落里两个人在低声讨论公司并购', emoji: '🤫',
  optionA: { label: '假装打电话靠近偷听', cost: 0, infoReward: true, infoAccuracy: 0.55, infoContent: '某行业并购传闻' },
  optionB: { label: '别做这种事', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '保持人品' },
},
```

- [ ] **Step 2: 为"高级餐厅"追加2个事件（现有2个→4个）**

```typescript
{
  id: 'rest-03', sceneId: 'restaurant',
  description: '邻桌请了一位知名私募基金经理', emoji: '💼',
  optionA: { label: '主动过去敬酒搭话 ¥200', cost: 200, infoReward: true, infoAccuracy: 0.8, infoContent: '私募基金经理的市场判断' },
  optionB: { label: '太唐突了，算了', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'rest-04', sceneId: 'restaurant',
  description: '餐厅经理聊起最近高端消费回暖', emoji: '🥂',
  optionA: { label: '深入聊聊消费趋势', cost: 0, infoReward: true, infoAccuracy: 0.5, infoContent: '高端消费复苏信号' },
  optionB: { label: '点头微笑，继续吃', cost: 0, infoReward: false, infoAccuracy: 0 },
},
```

- [ ] **Step 3: 为"KTV"追加2个事件（现有2个→4个）**

```typescript
{
  id: 'ktv-03', sceneId: 'ktv',
  description: '有个投行的朋友来晚了，满脸兴奋', emoji: '😄',
  optionA: { label: '问他什么好事', cost: 0, infoReward: true, infoAccuracy: 0.75, infoContent: '投行朋友透露的行业大动作' },
  optionB: { label: '先让他唱首歌', cost: 0, infoReward: false, infoAccuracy: 0 },
},
{
  id: 'ktv-04', sceneId: 'ktv',
  description: '有人提议赌唱歌输赢', emoji: '🎲',
  optionA: { label: '参加赌局 ¥200', cost: 200, infoReward: false, infoAccuracy: 0, specialEffect: '50%概率赢回¥400（冒险精神）' },
  optionB: { label: '看热闹就好', cost: 0, infoReward: false, infoAccuracy: 0 },
},
```

- [ ] **Step 4: 为"SPA"追加2个事件（现有2个→4个）**

```typescript
{
  id: 'spa-03', sceneId: 'spa',
  description: '理疗师说她的好多客户最近都在聊某个行业', emoji: '💆‍♀️',
  optionA: { label: '好奇问问', cost: 0, infoReward: true, infoAccuracy: 0.4, infoContent: '富人圈子的热门话题方向' },
  optionB: { label: '闭眼享受', cost: 0, infoReward: false, infoAccuracy: 0, specialEffect: '深度放松' },
},
{
  id: 'spa-04', sceneId: 'spa',
  description: '休息区遇到一位基金公司VP，他在休假', emoji: '🏖️',
  optionA: { label: '请他喝杯茶聊几句 ¥100', cost: 100, infoReward: true, infoAccuracy: 0.85, infoContent: '机构级别的板块配置方向' },
  optionB: { label: '尊重人家的假期', cost: 0, infoReward: false, infoAccuracy: 0 },
},
```

- [ ] **Step 5: Commit**

```bash
git add src/data/scenes.ts
git commit -m "content: add 8 new events for bar, restaurant, ktv, spa scenes"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计规格§5.2要求"每场景3-5个事件池"，扩充后各场景事件数：home=4, park=4, phone=4, food-stall=5, bookstore=4, convenience=3, bar=5, restaurant=4, ktv=4, spa=4 — 全部达标 ✅
- [x] **Placeholder scan:** 所有事件数据包含完整的 id/sceneId/description/emoji/optionA/optionB，无 TBD ✅
- [x] **Type consistency:** 所有新事件符合 `SceneEvent` 接口（id, sceneId, description, emoji, optionA: EventOption, optionB: EventOption）✅
- [x] **ID唯一性:** 所有新 id 遵循 `{场景}-{序号}` 格式，无重复 ✅
