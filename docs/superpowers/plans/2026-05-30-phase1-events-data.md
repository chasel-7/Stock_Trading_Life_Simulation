# Phase 1: 生活事件频率 + 场景事件数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust life event trigger rates to match spec and create the scene events data module with all 38 events across 10 scenes.

**Architecture:** A new standalone data file `sceneEvents.js` defines event pools per scene. Life event probabilities are a one-line constant change. Both are pure data changes with no UI logic.

**Tech Stack:** JavaScript (ES Modules), React (for later consumption)

---

### Task 1: Adjust Life Event Trigger Probabilities

**Files:**
- Modify: `frontend/src/App.jsx:381-386`

- [ ] **Step 1: Update the probability constants**

In `frontend/src/App.jsx`, find the `transitionToNextDay` function (around line 381) and change the `roleProbabilities` object:

```js
const roleProbabilities = {
    internet_worker: 0.50,
    freelancer: 0.80,
    sales_manager: 0.65,
    government_worker: 0.55
};
```

Old values were `0.15, 0.40, 0.25, 0.10`. The new values align with the spec: internet_worker ~0.5/day, freelancer ~1.5/day (capped at 0.80 since architecture supports max 1 event/day), sales_manager ~1/day, government_worker ~1/day.

- [ ] **Step 2: Verify the build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "fix: adjust life event trigger rates to match spec (0.50/0.80/0.65/0.55)"
```

---

### Task 2: Create Scene Events Data Module

**Files:**
- Create: `frontend/src/data/sceneEvents.js`

- [ ] **Step 1: Create the data file with all 10 scene event pools**

Create `frontend/src/data/sceneEvents.js` with the following content:

```js
/**
 * 盘后场景事件池
 * 每个场景 3~5 个事件，进入场景后随机抽 1~3 张卡片展示。
 * 
 * 事件数据结构:
 *   id:       唯一标识
 *   title:    事件标题 (含emoji)
 *   desc:     事件描述文案
 *   options:  A/B 两个选项 [{text, effect, cost?, infoQuality?, moneyDelta?, buffType?}]
 * 
 * effect 类型:
 *   "info"    — 获取情报 (infoQuality 0~1 为准确率)
 *   "buff"    — 获得增益 (buffType: "fee_half_5d" | "double_salary" | "reduce_neg_event")
 *   "money"   — 现金变化 (moneyDelta 正=收入 负=支出)
 *   "gamble"  — 赌博 (winChance 0~1, winAmount, loseAmount)
 *   "none"    — 无效果
 *   "hint"    — 纯文字提示 (心态/生活建议)
 */

export const SCENE_EVENTS = {
    "🏠 回家吃泡面": [
        {
            id: "home_01",
            title: "📺 深夜财经节目",
            desc: "泡面刚泡好，电视正好播到一档股评节目。主持人一脸自信地推荐了一只股票，说得头头是道。",
            options: [
                {
                    text: "认真看完并记下来",
                    effect: "info",
                    infoQuality: 0.3,
                },
                {
                    text: "切到综艺频道算了",
                    effect: "none",
                }
            ]
        },
        {
            id: "home_02",
            title: "📦 翻出旧报纸",
            desc: "搬东西时翻出一叠上个月的财经报纸，头版标题赫然写着某个板块即将迎来政策利好。",
            options: [
                {
                    text: "仔细研读财经版",
                    effect: "info",
                    infoQuality: 0.2,
                },
                {
                    text: "直接扔进垃圾桶",
                    effect: "none",
                }
            ]
        },
        {
            id: "home_03",
            title: "🛏️ 失眠反思",
            desc: "躺在床上辗转反侧，脑海中不断回放今天的交易操作。也许复盘一下能让自己心安？",
            options: [
                {
                    text: "打开笔记本复盘今日操作",
                    effect: "hint",
                    hintText: "复盘完毕。你意识到：频繁交易并不能提高收益，反而增加了手续费损耗。冷静是最好的策略。",
                },
                {
                    text: "翻个身直接睡觉",
                    effect: "none",
                }
            ]
        },
    ],

    "🌳 公园散步": [
        {
            id: "park_01",
            title: "👴 偶遇退休老股民",
            desc: "公园长椅上坐着一位退休大爷，手里攥着一部老年智能机，屏幕上赫然是股票行情。他主动跟你搭话。",
            options: [
                {
                    text: "坐下来跟大爷聊聊",
                    effect: "info",
                    infoQuality: 0.3,
                },
                {
                    text: "微笑点头后离开",
                    effect: "none",
                }
            ]
        },
        {
            id: "park_02",
            title: "🐕 遛狗大妈搭话",
            desc: "一位遛金毛的大妈突然凑过来说："小伙子，你知道吗？我邻居前两天炒股赚了好几万！"",
            options: [
                {
                    text: "好奇地追问细节",
                    effect: "info",
                    infoQuality: 0.3,
                },
                {
                    text: "借口赶时间先走",
                    effect: "none",
                }
            ]
        },
        {
            id: "park_03",
            title: "📻 广场舞队放财经播报",
            desc: "路过广场舞区域，大喇叭里居然在放财经新闻播报。隐约听到了某个板块的名字。",
            options: [
                {
                    text: "驻足仔细听一会",
                    effect: "info",
                    infoQuality: 0.2,
                },
                {
                    text: "继续散步不理会",
                    effect: "none",
                }
            ]
        },
        {
            id: "park_04",
            title: "🧘 公园冥想",
            desc: "找了个安静的角落坐下来，闭上眼睛深呼吸。也许放空一下能帮助理清交易思路。",
            options: [
                {
                    text: "静坐冥想十分钟",
                    effect: "hint",
                    hintText: "冥想结束。你感到内心平静了许多。提醒自己：不要被市场的短期波动牵着鼻子走，坚持自己的交易计划。",
                },
                {
                    text: "算了还是继续走走",
                    effect: "none",
                }
            ]
        },
    ],

    "📱 刷手机": [
        {
            id: "phone_01",
            title: "📰 大V推荐文章",
            desc: "刷到一篇百万粉丝财经大V的深度分析文章，标题很吸引人：《这只股票被严重低估》。",
            options: [
                {
                    text: "仔细阅读全文",
                    effect: "info",
                    infoQuality: 0.4,
                },
                {
                    text: "标题党，划走不看",
                    effect: "none",
                }
            ]
        },
        {
            id: "phone_02",
            title: "💬 股吧热帖",
            desc: "股吧里有一个帖子火了，楼主晒出了自己的持仓和对某只股票的分析，评论区吵翻了天。",
            options: [
                {
                    text: "追帖看看大家的观点",
                    effect: "info",
                    infoQuality: 0.4,
                },
                {
                    text: "关掉APP休息",
                    effect: "none",
                }
            ]
        },
        {
            id: "phone_03",
            title: "📊 券商弹窗研报",
            desc: "手机弹出一条券商APP推送：「最新研报：某股评级上调至"强烈推荐"」。要不要点进去看看？",
            options: [
                {
                    text: "点进去仔细看看",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "嫌烦，直接关掉弹窗",
                    effect: "none",
                }
            ]
        },
        {
            id: "phone_04",
            title: "🎮 好友拉你打游戏",
            desc: "老铁发来微信："别看盘了！来两把游戏放松放松！"",
            options: [
                {
                    text: "好嘞！打一局放松心情",
                    effect: "hint",
                    hintText: "打了一局游戏，心情舒畅了不少。适当放松有利于保持交易判断力，别让焦虑控制了你的操作。",
                },
                {
                    text: "不了，我再刷会财经",
                    effect: "none",
                }
            ]
        },
    ],

    "🍜 大排档": [
        {
            id: "food_01",
            title: "🍺 旁边桌老股民吹牛",
            desc: "隔壁桌几个中年大叔喝着扎啤聊得正起劲，其中一个拍着桌子说自己买的股涨停了。听起来他对某个板块很有研究。",
            options: [
                {
                    text: "再帮他们点一轮酒 ¥100，套套话",
                    effect: "info",
                    cost: 100,
                    infoQuality: 0.6,
                },
                {
                    text: "免费蹭听他吹牛",
                    effect: "info",
                    infoQuality: 0.3,
                }
            ]
        },
        {
            id: "food_02",
            title: "👨‍🍳 老板娘聊闲天",
            desc: "大排档老板娘一边擦桌子一边跟你唠嗑。她说她老公是个操盘手，天天在家看盘。",
            options: [
                {
                    text: "跟老板娘多聊两句",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "只管吃饭不多聊",
                    effect: "none",
                }
            ]
        },
        {
            id: "food_03",
            title: "📞 朋友突然发来股票截图",
            desc: "正吃着烤串，手机震了。好兄弟发来一张交割单截图，配文："跟上！这只票明天还要涨！"",
            options: [
                {
                    text: "嗯嗯，记下来明天关注",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "当耳旁风，继续吃串",
                    effect: "none",
                }
            ]
        },
        {
            id: "food_04",
            title: "🤝 隔壁桌居然是同行",
            desc: "聊着聊着发现隔壁桌的哥们儿跟你是同行，他对市场也有自己的看法。互换个微信？",
            options: [
                {
                    text: "加微信换消息",
                    effect: "info",
                    infoQuality: 0.6,
                },
                {
                    text: "各吃各的，不社交",
                    effect: "none",
                }
            ]
        },
    ],

    "📚 书店": [
        {
            id: "book_01",
            title: "📖 发现一本交易心理学",
            desc: "书架上一本《交易心理学》吸引了你的目光。翻了几页感觉写得非常深刻，尤其是关于控制交易成本的章节。",
            options: [
                {
                    text: "买下来认真阅读（交易手续费减半 5 天）",
                    effect: "buff",
                    buffType: "fee_half_5d",
                },
                {
                    text: "翻了翻放回去",
                    effect: "none",
                }
            ]
        },
        {
            id: "book_02",
            title: "🧑‍🏫 偶遇大学金融教授",
            desc: "在投资类书架前，一位戴眼镜的中年人主动跟你搭话。他自我介绍是本地大学的金融学教授。",
            options: [
                {
                    text: "虚心请教投资策略",
                    effect: "info",
                    infoQuality: 0.6,
                },
                {
                    text: "点头微笑，装作不认识",
                    effect: "none",
                }
            ]
        },
        {
            id: "book_03",
            title: "📰 发现限量版财经月刊",
            desc: "收银台旁边摆着一本限量版的《巴伦周刊中国版》，标价 ¥50。封面故事是关于A股某板块的深度调研。",
            options: [
                {
                    text: "花 ¥50 买一本看看",
                    effect: "info",
                    cost: 50,
                    infoQuality: 0.5,
                },
                {
                    text: "太贵了不买",
                    effect: "none",
                }
            ]
        },
    ],

    "🏪 便利店买啤酒": [
        {
            id: "conv_01",
            title: "🍻 收银员小哥搭话",
            desc: "结账时收银员小哥看你一脸疲惫，问你是不是炒股的。他说他也炒，大学学的就是金融。",
            options: [
                {
                    text: "聊两句交流下",
                    effect: "info",
                    infoQuality: 0.3,
                },
                {
                    text: "付钱走人",
                    effect: "none",
                }
            ]
        },
        {
            id: "conv_02",
            title: "📰 收银台旁的财经杂志",
            desc: "等找零的时候瞥见收银台旁边摆了一本财经杂志，封面上有个醒目的股票代码。",
            options: [
                {
                    text: "站着翻两页看看",
                    effect: "info",
                    infoQuality: 0.2,
                },
                {
                    text: "不感兴趣",
                    effect: "none",
                }
            ]
        },
        {
            id: "conv_03",
            title: "🎰 门口的刮刮乐摊位",
            desc: "便利店门口摆着刮刮乐摊位。"试试手气吧小伙子！20块一张！"老板热情地招呼你。",
            options: [
                {
                    text: "来一张试试运气！ ¥20",
                    effect: "gamble",
                    cost: 20,
                    winChance: 0.45,
                    winAmount: 100,
                    loseAmount: 0,
                },
                {
                    text: "不赌，走了",
                    effect: "none",
                }
            ]
        },
    ],

    "🍺 酒吧": [
        {
            id: "bar_01",
            title: "🍸 有人请你喝酒",
            desc: "隔壁桌一个看起来很面善的大哥主动给你倒了杯威士忌。"来，聊聊？我也是做投资的。"",
            options: [
                {
                    text: "喝！回请一杯 ¥200，跟他深聊",
                    effect: "info",
                    cost: 200,
                    infoQuality: 0.5,
                },
                {
                    text: "谢绝好意",
                    effect: "none",
                }
            ]
        },
        {
            id: "bar_02",
            title: "📞 老板突然打电话来",
            desc: "正喝着呢，手机响了——是老板。"明天有个紧急项目，需要你加班一天。报酬嘛，双倍日薪。"",
            options: [
                {
                    text: "接受加班（明天双倍日薪）",
                    effect: "buff",
                    buffType: "double_salary",
                },
                {
                    text: "假装信号不好挂掉",
                    effect: "none",
                }
            ]
        },
        {
            id: "bar_03",
            title: "🤝 遇到前同事",
            desc: "吧台那边有个熟悉的身影——是你以前的同事！他现在跳槽去了一家券商研究所。",
            options: [
                {
                    text: "过去聊聊叙叙旧",
                    effect: "info",
                    infoQuality: 0.7,
                },
                {
                    text: "装作没看见",
                    effect: "none",
                }
            ]
        },
        {
            id: "bar_04",
            title: "💃 搭讪到券商销售",
            desc: "旁边坐着一位穿着干练的女士，聊了几句发现她是某头部券商的机构销售总监。",
            options: [
                {
                    text: "加微信深入交流",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "社恐发作，不敢搭话",
                    effect: "none",
                }
            ]
        },
        {
            id: "bar_05",
            title: "🎲 有人邀你玩骰子",
            desc: ""来两把？三个骰子比大小，一把 ¥300！"几个喝嗨了的年轻人向你招手。",
            options: [
                {
                    text: "上！赌一把 ¥300",
                    effect: "gamble",
                    cost: 300,
                    winChance: 0.45,
                    winAmount: 600,
                    loseAmount: 0,
                },
                {
                    text: "不赌，我就看看",
                    effect: "none",
                }
            ]
        },
    ],

    "🍽️ 高级餐厅": [
        {
            id: "dine_01",
            title: "🍷 偶遇明星基金经理",
            desc: "邻座的中年男人正在打电话说 portfolio，你一搜发现他竟然是某知名私募的合伙人！",
            options: [
                {
                    text: "鼓起勇气请他喝杯红酒 ¥200",
                    effect: "info",
                    cost: 200,
                    infoQuality: 0.8,
                },
                {
                    text: "点头之交就好",
                    effect: "none",
                }
            ]
        },
        {
            id: "dine_02",
            title: "💼 邻座是上市公司高管",
            desc: "无意中听到邻桌在讨论董事会决议和下个季度的业绩预期，声音不大但内容很劲爆。",
            options: [
                {
                    text: "主动过去搭讪攀谈",
                    effect: "info",
                    infoQuality: 0.7,
                },
                {
                    text: "安静用餐，不打扰",
                    effect: "none",
                }
            ]
        },
        {
            id: "dine_03",
            title: "📋 餐厅老板推荐私募产品",
            desc: "餐厅老板亲自过来敬酒，聊起来发现他自己也在做私募投资。他建议你关注某个方向。",
            options: [
                {
                    text: "洗耳恭听，记下来",
                    effect: "info",
                    infoQuality: 0.6,
                },
                {
                    text: "礼貌拒绝，不谈投资",
                    effect: "none",
                }
            ]
        },
        {
            id: "dine_04",
            title: "🎻 偷听VIP包间传出的消息",
            desc: "去洗手间的路上经过VIP包间，隐约听到里面有人在大声说："…那只票下周一定会…"",
            options: [
                {
                    text: "放慢脚步竖起耳朵",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "假装没听到，继续走",
                    effect: "none",
                }
            ]
        },
    ],

    "🎤 KTV包场": [
        {
            id: "ktv_01",
            title: "🎤 唱到嗨点忘记忧愁",
            desc: "麦霸模式开启！你连唱了三首歌，把今天的交易压力全部释放了出去。",
            options: [
                {
                    text: "继续嗨！尽情释放压力",
                    effect: "buff",
                    buffType: "reduce_neg_event",
                },
                {
                    text: "低调旁观，保存体力",
                    effect: "none",
                }
            ]
        },
        {
            id: "ktv_02",
            title: "🍾 有人开香槟庆祝",
            desc: "隔壁包间的大佬过来敬酒，说今天股票赚了不少。他兴致很高，拉你聊起了股市。",
            options: [
                {
                    text: "凑过去跟他聊聊",
                    effect: "info",
                    infoQuality: 0.4,
                },
                {
                    text: "不聊股票了，继续唱歌",
                    effect: "none",
                }
            ]
        },
        {
            id: "ktv_03",
            title: "💰 朋友提议AA赌唱歌",
            desc: ""下一首谁唱得分高谁赢！每人 ¥200！"朋友举着话筒向你挑战。",
            options: [
                {
                    text: "来啊！谁怕谁 ¥200",
                    effect: "gamble",
                    cost: 200,
                    winChance: 0.5,
                    winAmount: 400,
                    loseAmount: 0,
                },
                {
                    text: "算了，我唱歌不行",
                    effect: "none",
                }
            ]
        },
    ],

    "💆 SPA会所": [
        {
            id: "spa_01",
            title: "💎 VIP休息区遇神秘大佬",
            desc: "VIP休息区的沙发上坐着一位气场十足的中年人。攀谈后发现他是某上市公司的实际控制人，对市场了如指掌。",
            options: [
                {
                    text: "诚恳请教，深入攀谈",
                    effect: "info",
                    infoQuality: 1.0,
                    isIdentityReveal: true,
                },
                {
                    text: "安静休息，不打扰",
                    effect: "none",
                }
            ]
        },
        {
            id: "spa_02",
            title: "🧖 技师聊天",
            desc: "技师一边按摩一边闲聊，说她的老顾客很多都是做投资的，有的赚了大钱有的赔了不少。",
            options: [
                {
                    text: "好奇追问：他们都投什么？",
                    effect: "info",
                    infoQuality: 0.5,
                },
                {
                    text: "安静享受，不多聊",
                    effect: "none",
                }
            ]
        },
        {
            id: "spa_03",
            title: "📱 收到私募基金邀请短信",
            desc: "手机震了一下，是一条私募基金的邀请短信。发送者是一家口碑不错的量化私募。",
            options: [
                {
                    text: "回复短信留下联系方式",
                    effect: "info",
                    infoQuality: 0.8,
                },
                {
                    text: "当垃圾短信删除",
                    effect: "none",
                }
            ]
        },
        {
            id: "spa_04",
            title: "🔮 遇到一位「命理大师」",
            desc: "大厅里一位穿着中式长衫的老者自称是「财运命理大师」，说可以帮你测算财运走势。",
            options: [
                {
                    text: "花 ¥500 让他算算",
                    effect: "info",
                    cost: 500,
                    infoQuality: 0.9,
                },
                {
                    text: "不信这一套",
                    effect: "none",
                }
            ]
        },
    ],
};

/**
 * 从指定场景的事件池中随机抽取 1~3 个事件
 * @param {string} sceneName - 场景名称 (如 "🍺 酒吧")
 * @returns {Array} 抽中的事件数组
 */
export function drawSceneEvents(sceneName) {
    const pool = SCENE_EVENTS[sceneName];
    if (!pool || pool.length === 0) return [];

    // 打乱事件池
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    // 抽 1~3 张 (不超过池大小)
    const count = Math.min(pool.length, 1 + Math.floor(Math.random() * 3));
    return shuffled.slice(0, count);
}
```

- [ ] **Step 2: Verify the build**

Run: `cd frontend && npm run build`
Expected: Build succeeds. The file is a pure data module, no runtime side effects.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/data/sceneEvents.js
git commit -m "feat: add scene events data module with 38 events across 10 scenes"
```
