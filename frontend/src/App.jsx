import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import { api } from './api/client';
import KLineChart from './components/KLineChart';
import StockRow from './components/StockRow';
import PVPMonitor from './components/PVPMonitor';
import DecisionCard from './components/DecisionCard';
import WatchList from './components/WatchList';
import RadarChart from './components/RadarChart';
import StockReveal from './components/StockReveal';
import { diagnoseBiases, calculateRadarMetrics } from './store/diagnostics';

const LIFE_EVENTS = [
    {
        id: "appliance_damaged",
        title: "🏠 家电突然损坏",
        desc: "大清早你发现家里的冰箱和空调同时坏了，维修师傅说已经没有维修价值，必须换新。",
        options: [
            {
                text: "花费 2,000 元换新电器",
                cost: 2000,
                effect: (store) => {
                    store.addSceneSpend("更换家电支出", 2000);
                    return "你花了 2,000 元购置了新空调与冰箱，流动现金减少了 2,000 元。";
                }
            }
        ]
    },
    {
        id: "friend_borrow",
        title: "👨‍👩‍👦 亲友开口借钱",
        desc: "表哥发来微信，说周转不灵想借一些流动现金应急，承诺 10 天后（Day 15 前）以 1.2 倍金额还你。",
        options: [
            {
                text: "借出流动现金的 20%",
                effect: (store) => {
                    const amount = Math.floor(store.cash * 0.2);
                    if (amount <= 100) return "你手里没有充足余钱借出。";
                    store.addSceneSpend("借款给亲友", amount);
                    store.addRepayment({ dueDay: Math.min(15, store.day + 10), amount: Math.floor(amount * 1.2) });
                    return `你借出了 ¥${amount}。表哥十分感激，承诺 10 天后归还 ¥${Math.floor(amount * 1.2)}。`;
                }
            },
            {
                text: "委婉拒绝（股市吃紧）",
                effect: (store) => {
                    return "你借口资金全套在股市里婉拒了。";
                }
            }
        ]
    },
    {
        id: "wife_complaint",
        title: "💍 伴侣的埋怨",
        desc: "最近股市大跌让你情绪焦虑，伴侣埋怨你只顾炒股不顾家，要求你买一份礼物赔罪。",
        options: [
            {
                text: "购买道歉礼物 (花费当前流动现金的 10%)",
                effect: (store) => {
                    const cost = Math.max(500, Math.floor(store.cash * 0.1));
                    store.addSceneSpend("购买道歉礼物", cost);
                    return `你花费了 ¥${cost} 购买礼物。伴侣心情转晴。`;
                }
            }
        ],
        condition: (store, todayProfitRate) => todayProfitRate <= -5
    },
    {
        id: "health_issue",
        title: "🏥 身体突发不适",
        desc: "因极度看盘焦虑，你突然感到重度头晕。医生警告你明日必须缩短屏幕时间。",
        options: [
            {
                text: "好的（明日看盘速度变快为 2 倍，操盘速度翻倍）",
                effect: (store) => {
                    store.setTickRateMultiplier(2.0);
                    return "明天将缩短操盘看屏时间，看盘速度变为 2 倍！";
                }
            }
        ]
    },
    {
        id: "friend_treat",
        title: "🎉 朋友请客洗脚",
        desc: "你的老铁今天大赚拉你去洗脚，洗脚过程中他神神秘秘向你透露了一条小道消息。",
        options: [
            {
                text: "乐意前往（免费得个股提示线索）",
                effect: (store) => {
                    const stocks = ["科技-01", "科技-02", "科技-07", "消费-01", "消费-02", "制造-01", "金融-01"];
                    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
                    store.addInfoHint({
                        stock: randomStock,
                        source: "朋友请客",
                        text: `${randomStock} 的大单资金今天有暗中异动！`,
                        type: "positive"
                    });
                    return `朋友悄悄告诉你：【${randomStock}】近日有机构建仓迹象。`;
                }
            }
        ]
    },
    {
        id: "emergency_meeting",
        title: "💼 紧急部门会议",
        desc: "公司突然要求下午 14:00 召开全体紧急会议，届时你的任何买卖交易都会被强行中断，只能维持现状。",
        options: [
            {
                text: "被迫参会",
                effect: (store) => {
                    store.setMeetingForceEnd(true);
                    return "没办法，身不由己，只好去开会了。下午 14:00 (分时进度 180 起) 将无法进行任何股票交易。";
                }
            }
        ],
        condition: (store) => ["internet_worker", "sales_manager", "government_worker"].includes(store.roleType)
    },
    {
        id: "project_bonus",
        title: "💰 部门项目奖金",
        desc: "你在工作中主导的项目成果斐然，公司决定提前给你发放一笔项目特别分红！",
        options: [
            {
                text: "爽快收下 5,000 元分红",
                effect: (store) => {
                    store.addSceneSpend("项目分红", -5000);
                    return "你获得了 ¥5,000 特别分红，流动现金增加了！";
                }
            }
        ],
        condition: (store) => ["internet_worker", "sales_manager"].includes(store.roleType)
    }
];

const ROLE_OPTIONS = [
    {
        id: "internet_worker",
        name: "互联网打工人",
        icon: "🧑‍💻",
        cash: 30000,
        salary: 800,
        cost: 200,
        desc: "信息流选手：每天可获得1条更清晰的行业动态推送。"
    },
    {
        id: "sales_manager",
        name: "销售经理",
        icon: "👔",
        cash: 20000,
        salary: 500,
        cost: 300,
        desc: "社交套利型：在盘后场景中进行社交消费享受 8 折优惠。"
    },
    {
        id: "freelancer",
        name: "自由职业者",
        icon: "🏠",
        cash: 50000,
        salary: "0~1000 随机",
        cost: 150,
        desc: "纯操盘手：天然享受 0.5% 超低交易手续费（书店叠加可降至 0.25%）。"
    },
    {
        id: "government_worker",
        name: "体制内青年",
        icon: "👩‍🏫",
        cash: 15000,
        salary: 400,
        cost: 100,
        desc: "稳健投资：工作极度稳定，每3天可获得一次免费的深度行业研报。"
    }
];

export default function App() {
    const store = useGameStore();
    const [userId, setUserId] = useState('player_' + Math.random().toString(36).substr(2, 5));
    const [username, setUsername] = useState('天梯大牛');
    const [selectedRole, setSelectedRole] = useState('internet_worker');
    
    // 局内行情与看盘状态
    const [marketData, setMarketData] = useState(null); // { stocks: [], prices: {}, bounds: {} }
    const [selectedStock, setSelectedStock] = useState("");
    const [tick, setTick] = useState(0);
    const [opponents, setOpponents] = useState({});
    const [isMatching, setIsMatching] = useState(false);
    const [history, setHistory] = useState([]);
    
    // 局内状态流转
    const [phase, setPhase] = useState('TRADE'); // 'TRADE' | 'NIGHT' | 'DECISION' | 'SETTLEMENT' | 'LIFE_EVENT'

    const [startOfDayAssets, setStartOfDayAssets] = useState(30000.0);
    const [todayProfitRate, setTodayProfitRate] = useState(0.0);
    const [selectedScene, setSelectedScene] = useState(null);
    const [settlementReport, setSettlementReport] = useState(null);
    const wsRef = useRef(null);

    // 盘前提示信息（打工人或体制内青年专属特权）
    const [pretradeMessage, setPretradeMessage] = useState("");

    // 新增：突发生活事件与晨报、强平报告状态
    const [activeLifeEvent, setActiveLifeEvent] = useState(null);
    const [liquidationReport, setLiquidationReport] = useState(null);
    const [morningBrief, setMorningBrief] = useState(null);
    const [showMorningBrief, setShowMorningBrief] = useState(false);

    // 当 day 发生改变，或 phase 转换到 TRADE 时，从后端拉取当天的 15 支股的行情数据
    useEffect(() => {
        if (!store.isPlaying || phase !== 'TRADE') return;
        
        let active = true;
        const fetchMarket = async () => {
            try {
                const data = await api.getMarketInfo(store.matchSeed, store.day);
                if (active) {
                    setMarketData(data);
                    if (data.bounds) {
                        store.recordDailyPrices(data.bounds);
                    }
                    if (data.stocks && data.stocks.length > 0) {
                        if (!data.stocks.includes(selectedStock)) {
                            setSelectedStock(data.stocks[0]);
                        }
                    }
                    
                    // 生成职业盘前专属提示
                    let msg = `今日为交易日 Day ${store.day}。`;
                    if (store.roleType === 'internet_worker') {
                        msg += `【打工人行业雷达】提示：今日市场热度似乎聚集在 “科技” 与 “医药” 板块！`;
                    } else if (store.roleType === 'government_worker' && store.day % 3 === 1) {
                        msg += `【体制内深度研报】提示：检测到资金正在持续流入 “金融” 蓝筹股！`;
                    }
                    setPretradeMessage(msg);

                    // 自动弹出晨报展示
                    generateMorningBriefForDay(store.day, data);
                }
            } catch (err) {
                console.error("Failed to fetch market data:", err);
            }
        };
        fetchMarket();
        return () => {
            active = false;
        };
    }, [store.isPlaying, store.day, phase]);

    // 控制分时图逐步前进渲染的 tick 定时器
    useEffect(() => {
        if (!store.isPlaying || phase !== 'TRADE' || !marketData) return;
        setTick(0);
        const interval = setInterval(() => {
            setTick((t) => {
                if (t >= 239) {
                    clearInterval(interval);
                    return 239;
                }
                return t + 1;
            });
        }, 150 / (store.tickRateMultiplier || 1.0));
        return () => clearInterval(interval);
    }, [store.isPlaying, store.day, phase, marketData, store.tickRateMultiplier]);

    // tick 价格变动时，实时自动重算用户持仓的总市值与总资产
    useEffect(() => {
        if (!store.isPlaying || phase !== 'TRADE' || !marketData) return;
        const currentPricesMap = {};
        marketData.stocks.forEach((s) => {
            currentPricesMap[s] = marketData.prices[s]?.[tick] || marketData.bounds[s]?.open || 10.0;
        });
        store.updateAssets(currentPricesMap);
    }, [tick, marketData]);

    // 初始化连接 WebSocket 开始排队匹配
    const startMatchmaking = () => {
        setIsMatching(true);
        const socket = new WebSocket(`ws://localhost:8000/pvp/ws/${userId}`);
        wsRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({ action: "join_queue", elo: store.user?.elo_rating || 1200 }));
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            
            if (msg.type === "MATCH_FOUND") {
                setIsMatching(false);
                let initialCash = 30000.0;
                if (selectedRole === "sales_manager") initialCash = 20000.0;
                if (selectedRole === "freelancer") initialCash = 50000.0;
                if (selectedRole === "government_worker") initialCash = 15000.0;

                setStartOfDayAssets(initialCash);
                store.startGame(msg.match_seed, selectedRole, true);
                setPhase('TRADE');
                // 初始化对手列表
                const initOpp = {};
                msg.players.forEach(p => {
                    if (p !== userId) {
                        initOpp[p] = { day: 0, assets: initialCash, is_finished: false };
                    }
                });
                setOpponents(initOpp);
            } else if (msg.type === "OPPONENT_UPDATE") {
                setOpponents(prev => ({
                    ...prev,
                    [msg.user_id]: { day: msg.day, assets: msg.assets, is_finished: msg.is_finished }
                }));
            }
        };
    };

    // 本地进度发生改变时，自动将状态广播给房内对手
    useEffect(() => {
        if (store.isPlaying && store.isPvpMode && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                action: "update_status",
                day: store.day,
                assets: store.assets,
                is_finished: store.day >= 15
            }));
        }
    }, [store.day, store.assets, store.isPlaying]);

    const handleLogin = async () => {
        const userData = await api.login(userId, username);
        store.setUser(userData);
        const records = await api.getHistory(userData.id);
        setHistory(records);
    };

    // 自动渲染盘前晨报的数据生成
    const generateMorningBriefForDay = (dayNum, mData) => {
        const sectors = ["科技", "消费", "制造", "医药", "金融"];
        const activeSector = sectors[(dayNum * 7) % sectors.length];
        
        const allStocks = mData?.stocks || ["科技-01", "消费-01", "制造-01"];
        const rec1Idx = (dayNum * 13) % allStocks.length;
        const rec2Idx = (dayNum * 17) % allStocks.length;
        const rec1 = allStocks[rec1Idx];
        let rec2 = allStocks[rec2Idx];
        if (rec2 === rec1) {
            rec2 = allStocks[(rec2Idx + 1) % allStocks.length];
        }
        
        let extraHint = "";
        if (store.roleType === 'internet_worker') {
            const hintStock = allStocks[(dayNum * 23) % allStocks.length];
            extraHint = `🧑‍💻 职业特权小道消息：传闻主力资金今日将对【${hintStock}】进行洗盘吸筹，请自选防守。`;
        } else if (store.roleType === 'government_worker' && dayNum % 3 === 1) {
            extraHint = `👩‍🏫 职业特权宏观研报：政策主导支持【${activeSector}】实体转型，中长线资金流入。`;
        }
        
        setMorningBrief({
            day: dayNum,
            activeSector,
            recommendations: [rec1, rec2],
            extraHint
        });
        setShowMorningBrief(true);
    };

    const transitionToNextDay = () => {
        // 1. 结算工资与扣费
        store.nextDay();
        
        // 2. 判定生活突发随机事件
        const roleProbabilities = {
            internet_worker: 0.15,
            freelancer: 0.40,
            sales_manager: 0.25,
            government_worker: 0.10
        };
        const triggerRate = roleProbabilities[store.roleType] || 0.20;
        const triggerEvent = Math.random() < triggerRate;
        
        if (triggerEvent) {
            const validEvents = LIFE_EVENTS.filter(e => !e.condition || e.condition(store, todayProfitRate));
            if (validEvents.length > 0) {
                const randomEv = validEvents[Math.floor(Math.random() * validEvents.length)];
                setActiveLifeEvent(randomEv);
                setPhase('LIFE_EVENT');
                return;
            }
        }
        
        finalizeDayTransition();
    };

    const finalizeDayTransition = () => {
        // 3. 强平检查
        if (store.cash < 0) {
            const currentPricesMap = {};
            if (marketData && marketData.stocks) {
                marketData.stocks.forEach((s) => {
                    currentPricesMap[s] = marketData.prices[s]?.[tick] || marketData.bounds[s]?.open || 10.0;
                });
            } else {
                Object.keys(store.holdings).forEach(s => {
                    currentPricesMap[s] = 10.0;
                });
            }
            
            const res = store.runAutoLiquidation(currentPricesMap);
            if (!res.success) {
                alert("💀 资产自动强平结束后流动现金依然低于 0，系统判定破产！");
                handleSettlement(true);
                return;
            } else {
                setLiquidationReport(res.log);
            }
        }
        
        // 4. 重置看盘倍速
        store.setTickRateMultiplier(1.0);
        
        // 5. 更新起点总资产，返回交易盘
        setStartOfDayAssets(store.assets);
        setPhase('TRADE');
    };

    const handleEndTradeDay = () => {
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        const todayProfit = ((store.assets - startOfDayAssets) / startOfDayAssets) * 100;
        setTodayProfitRate(todayProfit);
        setPhase('NIGHT');
    };

    const selectScene = (scene) => {
        const isSales = store.roleType === 'sales_manager';
        const actualCost = isSales ? scene.cost * 0.8 : scene.cost;

        if (store.cash < actualCost) {
            alert("流动现金余额不足，无法进入该消费场景！");
            return;
        }
        setSelectedScene({
            ...scene,
            cost: actualCost
        });
        setPhase('DECISION');
    };

    const confirmScene = () => {
        if (selectedScene) {
            store.addSceneSpend(selectedScene.name, selectedScene.cost);
            
            // 根据选中的场景，提取并添加提示线索到 gatheredInfo!
            if (marketData && marketData.intelligence && marketData.intelligence.length > 0) {
                const charSum = selectedScene.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const intelIdx = (charSum + store.day) % marketData.intelligence.length;
                const intel = marketData.intelligence[intelIdx];
                
                let text = "";
                let type = "neutral";
                if (intel.direction === "up") {
                    type = "positive";
                    text = `根据在【${selectedScene.name}】打听到的内幕，${intel.stock}未来几天预计将迎来一波【${intel.trend}】！`;
                } else if (intel.direction === "down") {
                    type = "negative";
                    text = `在【${selectedScene.name}】听人闲聊得知，${intel.stock}近期面临利空，可能会出现【${intel.trend}】。`;
                } else {
                    type = "neutral";
                    text = `在【${selectedScene.name}】听人提起，${intel.stock}最近多空交织，走势可能以【${intel.trend}】为主。`;
                }
                
                store.addInfoHint({
                    stock: intel.stock,
                    source: selectedScene.name,
                    text: text,
                    type: type
                });
            }
        }

        if (store.day === 15) {
            // 第 15 天夜间结算：先完成最后一天的工资和扣费
            store.nextDay();
            
            // 强平检查
            if (store.cash < 0) {
                const currentPricesMap = {};
                marketData.stocks.forEach((s) => {
                    currentPricesMap[s] = marketData.prices[s]?.[tick] || marketData.bounds[s]?.open || 10.0;
                });
                const res = store.runAutoLiquidation(currentPricesMap);
                if (!res.success) {
                    alert("💀 第 15 天平仓结束后现金依然低于 0，系统判定破产！");
                    handleSettlement(true);
                    return;
                }
            }
            handleSettlement();
            return;
        }

        // 正常的日结过度流程
        transitionToNextDay();
    };

    const handleSettlement = async (isBankrupt = false) => {
        let initialCash = 30000.0;
        if (store.roleType === "sales_manager") initialCash = 20000.0;
        if (store.roleType === "freelancer") initialCash = 50000.0;
        if (store.roleType === "government_worker") initialCash = 15000.0;

        const finalAssets = isBankrupt ? 0.0 : store.assets;
        const profitRate = ((finalAssets - initialCash) / initialCash) * 100;
        
        // 诊断行为偏见与四维得分
        const biases = diagnoseBiases(store.transactionLog, store.dailyPricesHistory);
        const metrics = calculateRadarMetrics(
            profitRate,
            store.transactionLog,
            store.sceneLog,
            store.gatheredInfo,
            biases,
            store.hasLiquidated
        );

        // 记录旧的 ELO 分数以计算改变量
        const oldElo = store.user.elo_rating;

        // 提交战绩
        const recordData = {
            user_id: store.user.id,
            role_type: store.roleType,
            match_seed: store.matchSeed,
            final_cash: isBankrupt ? 0.0 : store.cash,
            final_assets: finalAssets,
            profit_rate: profitRate,
            transaction_log: store.transactionLog,
            scene_log: store.sceneLog,
            score_metrics: {
                "智慧": metrics["投资智慧"],
                "心态": metrics["心态稳定"],
                "社交": metrics["社交回报"],
                "平衡": metrics["生活平衡"]
            },
            is_practice: !store.isPvpMode
        };
        const submitResult = await api.submitRecord(recordData);
        
        // 关闭 WebSockets 联机连接
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        // 重新获取最新 Elo 并刷新本地状态
        const updatedUser = await api.login(store.user.id, store.user.username);
        store.setUser(updatedUser);

        // 计算 ELO 变化
        const eloDiff = updatedUser.elo_rating - oldElo;
        
        // 存储结算报告数据
        setSettlementReport({
            isVerified: submitResult.is_verified,
            oldElo: oldElo,
            newElo: updatedUser.elo_rating,
            eloDiff: eloDiff,
            isBankrupt: isBankrupt,
            biases: biases,
            metrics: metrics,
            leaderboard: [
                { userId: store.user.id, username: store.user.username + " (你)", assets: finalAssets, isFinished: true },
                ...Object.entries(opponents).map(([uid, data]) => ({
                    userId: uid,
                    username: uid.substring(0, 8) + "...",
                    assets: data.assets,
                    isFinished: data.is_finished
                }))
            ].sort((a, b) => b.assets - a.assets)
        });
        
        // 重新获取历史记录
        const records = await api.getHistory(store.user.id);
        setHistory(records);

        setPhase('SETTLEMENT');
    };

    const getUnlockedScenes = (profitRate) => {
        let unlocked = [
            { name: "🏠 回家吃泡面", cost: 0, desc: "吃着热气腾腾的泡面，看着搞笑视频，今天也是平淡而省钱的一天。" },
            { name: "🌳 公园散步", cost: 0, desc: "偶遇了一位退休大爷，大爷神神秘秘地透露：今天大盘震荡，科技板块好像有资金流出。" }
        ];
        if (profitRate >= -8) {
            unlocked.push(
                { name: "📱 刷手机", cost: 0, desc: "在财经论坛上刷到大V推荐文章：‘科技-01 已经处于历史估值底部，主力或将拉升。’" },
                { name: "🍜 大排档", cost: 200, desc: "喝扎啤时听到旁边桌的私募大佬醉熏熏地说：科技-01 明天可能会小幅调整，要拿稳！" }
            );
        }
        if (profitRate >= -2) {
            unlocked.push(
                { name: "📚 书店", cost: 100, desc: "买了一本《江恩理论》，内心平静许多。你感觉自己的交易手续费仿佛都跟着降了下来。" },
                { name: "🏪 便利店买啤酒", cost: 50, desc: "买了几罐冰镇啤酒，坐在街角看夜景，心情平淡踏实。" }
            );
        }
        if (profitRate >= 2) {
            unlocked.push(
                { name: "🍺 酒吧", cost: 300, desc: "搭讪到一位券商销售经理，她透露某只核心股目前被大机构增持，前景向好。" },
                { name: "🍽️ 高级餐厅", cost: 800, desc: "偶遇多年不见的明星基金经理，对方自信表示：‘科技股板块短期有一波波段机会。’" }
            );
        }
        if (profitRate >= 8) {
            unlocked.push(
                { name: "🎤 KTV包场", cost: 1500, desc: "高歌一曲释放了全部的交易压力，虽然花了不少钱，但心情变得极度放松。" },
                { name: "💆 SPA会所", cost: 2000, desc: "在VIP包厢里享受全身SPA，和邻座神秘大佬交流得知：科技-01 的真实资产背景极其深厚。" }
            );
        }
        return unlocked;
    };

    if (!store.user) {
        return (
            <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto', marginTop: '100px' }} className="glass-card">
                <h2>股票人生模拟器 - 登录入口</h2>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-gray)' }}>用户唯一ID</label>
                    <input value={userId} onChange={(e) => setUserId(e.target.value)} style={{ display: 'block', width: '100%', padding: '8px', boxSizing: 'border-box', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: 'var(--text-gray)' }}>角色昵称</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: 'block', width: '100%', padding: '8px', boxSizing: 'border-box', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
                </div>
                <button onClick={handleLogin} className="neon-btn-green" style={{ width: '100%', padding: '10px' }}>游客登录</button>
            </div>
        );
    }

    if (isMatching) {
        return (
            <div style={{ padding: '40px', maxWidth: '450px', margin: '100px auto', textAlign: 'center' }} className="glass-card">
                <h3>🔍 正在搜寻天梯实力相当的散户...</h3>
                <p style={{ color: 'var(--text-gray)' }}>当前寻找 4 人天梯对局，请稍候</p>
                <div className="loader" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid var(--neon-green)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '20px auto' }} />
                <button className="neon-btn-green" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }} onClick={() => setIsMatching(false)}>取消匹配</button>
            </div>
        );
    }

    if (!store.isPlaying && phase !== 'SETTLEMENT') {
        return (
            <div style={{ padding: '40px', maxWidth: '520px', margin: 'auto', marginTop: '60px' }} className="glass-card">
                <h3>大厅首屏 - 玩家昵称: {store.user.username}</h3>
                <h4 style={{ color: 'var(--neon-green)' }}>当前天梯分 (Elo): {store.user.elo_rating}</h4>
                
                {/* 职业身份卡片网格 */}
                <h4 style={{ margin: '20px 0 10px 0' }}>🎭 选择你的职业身份</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                    {ROLE_OPTIONS.map((opt) => {
                        const isSelected = selectedRole === opt.id;
                        return (
                            <div
                                key={opt.id}
                                onClick={() => setSelectedRole(opt.id)}
                                className="glass-card"
                                style={{
                                    padding: '12px',
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid var(--neon-green)' : '1px solid var(--border-color)',
                                    background: isSelected ? 'rgba(0, 230, 118, 0.05)' : 'rgba(25, 25, 35, 0.4)',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {opt.icon} {opt.name}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-gray)' }}>
                                    起薪/天: <span style={{ color: '#fff' }}>¥{opt.salary}</span><br />
                                    日生活费: <span style={{ color: '#fff' }}>¥{opt.cost}</span>
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--neon-green)', marginTop: '6px', borderTop: '1px dashed #444', paddingTop: '4px' }}>
                                    ⚡ {opt.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button onClick={startMatchmaking} className="neon-btn-green" style={{ width: '100%', padding: '15px' }}>🚀 寻找 PVP 竞技赛 (Elo 匹配)</button>
                <button 
                    onClick={() => {
                        const seed = 'practice_' + Math.random().toString(36).substr(2, 9);
                        let initialCash = 30000.0;
                        if (selectedRole === "sales_manager") initialCash = 20000.0;
                        if (selectedRole === "freelancer") initialCash = 50000.0;
                        if (selectedRole === "government_worker") initialCash = 15000.0;

                        setStartOfDayAssets(initialCash);
                        store.startGame(seed, selectedRole, false);
                        setPhase('TRADE');
                        setOpponents({});
                    }} 
                    className="neon-btn-green" 
                    style={{ width: '100%', padding: '15px', marginTop: '12px', borderColor: '#00b0ff', color: '#00b0ff' }}
                >
                    🎮 开启单人练习赛 (不计天梯分)
                </button>
                
                {history.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <h5>历史战绩：</h5>
                        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            {history.map((record) => (
                                <div key={record.id} style={{ fontSize: '11px', color: 'var(--text-gray)', padding: '4px 0' }}>
                                    #{record.id} | <span style={{ color: record.is_practice ? '#00b0ff' : 'var(--neon-green)', fontWeight: 'bold' }}>{record.is_practice ? '[练习]' : '[竞技]'}</span> | 职业: {ROLE_OPTIONS.find(r => r.id === record.role_type)?.name || record.role_type} | 资产: ¥{record.final_assets.toFixed(0)} | 收益: {record.profit_rate.toFixed(1)}% | {record.is_verified ? "验证通过" : "拒绝交易"}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 局内行情相关的临时参数
    const currentPrice = marketData?.prices[selectedStock]?.[tick] || marketData?.bounds[selectedStock]?.open || 10.0;
    const currentHolding = store.holdings[selectedStock] || 0;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
            {phase === 'TRADE' && marketData && (
                <>
                    {/* 盘前职业资讯条 */}
                    {pretradeMessage && (
                        <div className="glass-card" style={{ padding: '10px 15px', marginBottom: '15px', borderLeft: '4px solid var(--neon-green)', background: 'rgba(0, 230, 118, 0.03)', fontSize: '12px', color: '#eee' }}>
                            📢 {pretradeMessage}
                        </div>
                    )}

                    {/* 状态看板栏 */}
                    <div className="glass-card" style={{ padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0' }}>{store.isPvpMode ? '竞技赛对局' : '单人练习赛'} - Day {store.day} / 15</h3>
                            <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                                职业特权: {ROLE_OPTIONS.find(r => r.id === store.roleType)?.name} | 
                                {store.bookstoreDaysLeft > 0 ? ` 📚 书店Buff剩余 ${store.bookstoreDaysLeft} 天(手续费减半)` : ''}
                            </div>
                            <div style={{ fontSize: '11px', color: '#ccc', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🛡️ 自动强平策略:
                                <select 
                                    value={store.liquidationStrategy} 
                                    onChange={(e) => store.setLiquidationStrategy(e.target.value)}
                                    style={{ background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', padding: '2px 5px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                    <option value="profit_first">优先卖出浮盈股 (处置效应)</option>
                                    <option value="loss_first">优先卖出浮亏股 (理性止损)</option>
                                    <option value="value_first">优先卖出大市值股 (流动性至上)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                流动现金: <span style={{ color: store.cash >= 0 ? '#fff' : 'var(--neon-red)' }}>¥{store.cash.toFixed(2)}</span> | 总资产: ¥{store.assets.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px' }}>
                                今日分时步进: {tick} / 240 {store.tickRateMultiplier > 1.0 ? ' (⚡加速操盘中)' : ''}
                            </div>
                        </div>
                        <button className="neon-btn-green" onClick={handleEndTradeDay}>操盘完毕，进入盘后</button>
                    </div>

                    {/* 左右核心双栏布局 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '20px' }}>
                        {/* 左侧：自选股大盘列表 & 情报笔记本 */}
                        <div>
                            <WatchList
                                stocks={marketData.stocks}
                                prices={marketData.prices}
                                bounds={marketData.bounds}
                                tick={tick}
                                holdings={store.holdings}
                                selectedStock={selectedStock}
                                onSelectStock={setSelectedStock}
                            />

                            {/* 情报笔记本 */}
                            <div className="glass-card" style={{ padding: '15px', marginTop: '15px' }}>
                                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>📓 情报笔记本</h4>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', textAlign: 'left' }}>
                                    {/* 情报串联 */}
                                    {(() => {
                                        const grouped = {};
                                        store.gatheredInfo.forEach(info => {
                                            if (!grouped[info.stock]) grouped[info.stock] = [];
                                            grouped[info.stock].push(info);
                                        });
                                        
                                        const syntheses = [];
                                        Object.entries(grouped).forEach(([stock, items]) => {
                                            const sources = new Set(items.map(i => i.source));
                                            if (sources.size >= 2) {
                                                syntheses.push(
                                                    <div key={stock} style={{ border: '1px solid var(--neon-green)', background: 'rgba(0, 230, 118, 0.05)', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontSize: '11px' }}>
                                                        💡 <strong>【情报串联 - {stock}】</strong>: 经过 {Array.from(sources).join(' & ')} 交叉研判，确信该股有庄家或机构资金建仓迹象！
                                                    </div>
                                                );
                                            }
                                        });
                                        
                                        return syntheses.length > 0 ? syntheses : null;
                                    })()}
                                    
                                    {store.gatheredInfo.length === 0 ? (
                                        <div style={{ color: 'var(--text-gray)', fontSize: '12px', padding: '10px 0' }}>暂无盘后情报，多去大排档/酒吧社交收集线索吧。</div>
                                    ) : (
                                        store.gatheredInfo.map((info, idx) => (
                                            <div key={idx} style={{ fontSize: '11px', color: '#eee', padding: '4px 0', borderBottom: '1px dashed #222' }}>
                                                🔍 [{info.source}] <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{info.stock}</span>: {info.text}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 右侧：当前选中股详情看盘及交易 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="glass-card" style={{ padding: '15px' }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>📈 K线走势：{selectedStock}</h4>
                                <KLineChart prices={marketData.prices[selectedStock]?.slice(0, tick + 1) || [10.0]} />
                            </div>

                            {store.meetingForceEnd && tick >= 180 && (
                                <div style={{ background: 'rgba(239, 83, 80, 0.1)', borderLeft: '4px solid var(--neon-red)', color: 'var(--neon-red)', padding: '10px 15px', fontSize: '12px', borderRadius: '4px', textAlign: 'left' }}>
                                    💼 正在召开部门紧急会议 (14:00 后)，交易功能已被强制停用。请认真参会！
                                </div>
                            )}

                            <StockRow
                                stockName={selectedStock}
                                price={currentPrice}
                                holdingQty={currentHolding}
                                onTrade={(type, qty) => {
                                    if (store.meetingForceEnd && tick >= 180) {
                                        alert("💼 此时正是下午部门紧急会议时间，请认真听取领导发言，严禁偷偷进行股票买卖！");
                                        return;
                                    }
                                    if (type === 'BUY') {
                                        const success = store.buyStock(selectedStock, currentPrice, qty);
                                        if (!success) alert("可用负现金授信已达上限！");
                                    }
                                    if (type === 'SELL') {
                                        const success = store.sellStock(selectedStock, currentPrice, qty);
                                        if (!success) alert("持仓股份不足！");
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            {phase === 'NIGHT' && (
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>🌃 盘后社交阶段 (Day {store.day})</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                        今日盘中收益率: <span style={{ color: todayProfitRate >= 0 ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: 'bold' }}>
                            {todayProfitRate.toFixed(2)}%
                        </span>
                    </p>
                    <p style={{ fontSize: '13px', marginBottom: '20px' }}>根据今日损益与职业资产，您已累计解锁了以下场景：</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {getUnlockedScenes(todayProfitRate).map((scene) => {
                            const isSales = store.roleType === 'sales_manager';
                            const displayCost = isSales ? scene.cost * 0.8 : scene.cost;
                            return (
                                <button
                                    key={scene.name}
                                    className="neon-btn-green"
                                    onClick={() => selectScene(scene)}
                                    style={{ padding: '12px', fontSize: '13px' }}
                                >
                                    {scene.name} <br/>
                                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                                        花费: ¥{displayCost} 
                                        {isSales && scene.cost > 0 ? " (已享8折)" : ""}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {phase === 'DECISION' && selectedScene && (
                <DecisionCard
                    sceneName={selectedScene.name}
                    cost={selectedScene.cost}
                    description={selectedScene.desc}
                    onConfirm={confirmScene}
                />
            )}

            {phase === 'SETTLEMENT' && settlementReport && (
                <div className="glass-card" style={{ padding: '30px', maxWidth: '850px', margin: '40px auto', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--neon-green)', marginBottom: '5px' }}>🏆 {store.isPvpMode ? '竞技赛终局对局结算' : '练习赛终局对局结算'}</h2>
                    <p style={{ color: 'var(--text-gray)', fontSize: '13px', margin: '0 0 25px 0' }}>
                        重放验证: {settlementReport.isVerified ? 
                            <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>通过 (Legitimate)</span> : 
                            <span style={{ color: 'var(--neon-red)', fontWeight: 'bold' }}>拒绝 (Cheat Detected)</span>
                        }
                    </p>

                    {settlementReport.isBankrupt && (
                        <div style={{ color: 'var(--neon-red)', fontWeight: 'bold', fontSize: '18px', margin: '10px 0 20px 0' }}>
                            💀 您的公司/个人流动现金彻底归零，系统判定破产！
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', textAlign: 'left' }}>
                        {/* 左侧：雷达图与排名 */}
                        <div>
                            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>📊 四维交易表现</h4>
                            <RadarChart scores={settlementReport.metrics} />

                            {/* ELO Rating Badge */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {store.isPvpMode ? (
                                    <>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>天梯积分变动 (Elo)</div>
                                            <div style={{ fontSize: '13px', marginTop: '2px' }}>
                                                {settlementReport.oldElo} ➔ <span style={{ fontWeight: 'bold' }}>{settlementReport.newElo}</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="elo-change-badge" 
                                            style={{ color: settlementReport.eloDiff >= 0 ? 'var(--neon-green)' : 'var(--neon-red)', fontSize: '20px', fontWeight: 'bold' }}
                                        >
                                            {settlementReport.eloDiff >= 0 ? `+${settlementReport.eloDiff}` : settlementReport.eloDiff}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>天梯积分变动 (Elo)</div>
                                            <div style={{ fontSize: '13px', marginTop: '2px', color: '#00b0ff' }}>
                                                🎮 练习赛模式 (不计积分)
                                            </div>
                                        </div>
                                        <div 
                                            style={{ color: '#00b0ff', fontSize: '14px', fontWeight: 'bold' }}
                                        >
                                            暂无变动
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Leaderboard */}
                            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>🏁 本场对局排行</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {settlementReport.leaderboard.map((player, idx) => {
                                    const isSelf = player.userId === store.user.id;
                                    return (
                                        <div 
                                            key={player.userId} 
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                background: isSelf ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: isSelf ? '1px solid var(--neon-green)' : '1px solid transparent',
                                                fontSize: '12px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold', color: idx === 0 ? '#ffd700' : 'var(--text-gray)' }}>
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                                </span>
                                                <span style={{ fontWeight: isSelf ? 'bold' : 'normal' }}>{player.username}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold' }}>¥{player.assets.toFixed(0)}</div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-gray)' }}>
                                                    {player.isFinished ? '已完赛' : '未完赛'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 右侧：投资偏见诊断与股票映射 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px', color: 'var(--neon-red)' }}>
                                    🧠 投资偏见诊断 (Cognitive Bias)
                                </h4>
                                {settlementReport.biases.length === 0 ? (
                                    <div style={{ background: 'rgba(0, 230, 118, 0.04)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#eee' }}>
                                        🎉 <strong>完美克制偏见！</strong> 本局您没有表现出明显的交易行为偏差。交易心态平稳，理性克制，值得继续保持！
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {settlementReport.biases.map((bias) => (
                                            <div 
                                                key={bias.id} 
                                                style={{ 
                                                    background: 'rgba(255, 23, 68, 0.03)', 
                                                    border: '1px solid rgba(255, 23, 68, 0.2)', 
                                                    padding: '12px', 
                                                    borderRadius: '8px',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <strong style={{ color: 'var(--neon-red)', fontSize: '13px' }}>{bias.name}</strong>
                                                <p style={{ margin: '6px 0 8px 0', color: '#ddd', lineHeight: '1.4' }}>{bias.desc}</p>
                                                <div style={{ fontSize: '11px', color: 'var(--neon-yellow)', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                                                    {bias.tip}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 股票映射揭秘组件 */}
                            {marketData && marketData.stocks && (
                                <StockReveal stockList={marketData.stocks} />
                            )}
                        </div>
                    </div>

                    <button 
                        className="neon-btn-green" 
                        onClick={() => {
                            useGameStore.setState({ isPlaying: false });
                            setPhase('TRADE');
                            setSettlementReport(null);
                        }}
                        style={{ width: '100%', padding: '12px', marginTop: '30px' }}
                    >
                        返回主大厅
                    </button>
                </div>
            )}

            {/* 突发生活随机事件弹窗 */}
            {phase === 'LIFE_EVENT' && activeLifeEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ padding: '30px', maxWidth: '420px', width: '90%', textAlign: 'center', border: '1px solid var(--neon-green)' }}>
                        <span style={{ fontSize: '32px' }}>🔔</span>
                        <h3 style={{ margin: '10px 0 15px 0', color: 'var(--neon-green)' }}>{activeLifeEvent.title}</h3>
                        <p style={{ fontSize: '13px', color: '#eee', lineHeight: '1.6', marginBottom: '25px', textAlign: 'left' }}>
                            {activeLifeEvent.desc}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activeLifeEvent.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="neon-btn-green"
                                    onClick={() => {
                                        if (opt.cost && (store.cash - opt.cost < -store.assets)) {
                                            alert("💀 您的流动资金与授信资产已全部耗尽，信用额度爆仓，系统判定直接破产！");
                                            setActiveLifeEvent(null);
                                            handleSettlement(true);
                                            return;
                                        }
                                        const feedback = opt.effect(store);
                                        alert(feedback || "事件已处理完毕");
                                        setActiveLifeEvent(null);
                                        finalizeDayTransition();
                                    }}
                                    style={{ padding: '10px', fontSize: '12px' }}
                                >
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 盘后赤字强平报告 */}
            {liquidationReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ padding: '30px', maxWidth: '450px', width: '90%', textAlign: 'center', border: '1px solid var(--neon-red)' }}>
                        <h3 style={{ color: 'var(--neon-red)', margin: '0 0 10px 0' }}>⚠️ 盘后负债自动清仓报告</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                            由于您的流动现金已透支 (当前现金: ¥{store.cash.toFixed(2)})，系统已强制执行平仓弥补头寸。
                        </p>
                        <div style={{ margin: '15px 0', maxHeight: '180px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #333', color: 'var(--text-gray)' }}>
                                        <th style={{ padding: '6px', textAlign: 'left' }}>股票</th>
                                        <th style={{ padding: '6px' }}>平仓价格</th>
                                        <th style={{ padding: '6px' }}>平仓股数</th>
                                        <th style={{ padding: '6px', textAlign: 'right' }}>回笼资金</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liquidationReport.map((log, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                            <td style={{ padding: '6px', textAlign: 'left' }}>{log.stock}</td>
                                            <td style={{ padding: '6px' }}>¥{log.price.toFixed(2)}</td>
                                            <td style={{ padding: '6px' }}>{log.qty} 股</td>
                                            <td style={{ padding: '6px', textAlign: 'right', color: 'var(--neon-green)' }}>+¥{log.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', margin: '15px 0' }}>
                            平仓后流动现金：<span style={{ color: 'var(--neon-green)' }}>¥{store.cash.toFixed(2)}</span>
                        </div>
                        <button className="neon-btn-green" onClick={() => setLiquidationReport(null)} style={{ width: '100%', padding: '10px' }}>
                            确认并返回大厅
                        </button>
                    </div>
                </div>
            )}

            {/* 盘前推演晨报 */}
            {showMorningBrief && morningBrief && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ padding: '30px', maxWidth: '420px', width: '90%', textAlign: 'center', border: '1px solid var(--neon-green)' }}>
                        <h3 style={{ color: 'var(--neon-green)', margin: '0 0 10px 0' }}>📢 盘前推演晨报 (Day {morningBrief.day})</h3>
                        <div style={{ margin: '20px 0', textAlign: 'left', fontSize: '13px', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '10px' }}>
                                🔥 <strong>今日活跃板块：</strong> 
                                <span style={{ color: '#fff', background: 'rgba(0, 230, 118, 0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                                    {morningBrief.activeSector}板块
                                </span>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                📈 <strong>主力强力推荐：</strong> 
                                <span style={{ color: 'var(--neon-green)', marginLeft: '6px', fontWeight: 'bold' }}>{morningBrief.recommendations.join(', ')}</span>
                            </div>
                            {morningBrief.extraHint && (
                                <div style={{ borderTop: '1px dashed #444', paddingTop: '10px', color: 'var(--neon-yellow)', fontSize: '12px' }}>
                                    {morningBrief.extraHint}
                                </div>
                            )}
                        </div>
                        <button className="neon-btn-green" onClick={() => setShowMorningBrief(false)} style={{ width: '100%', padding: '10px' }}>
                            确认，开始操盘
                        </button>
                    </div>
                </div>
            )}

            {/* PVP 联机同步看板 */}
            {phase !== 'SETTLEMENT' && store.isPvpMode && <PVPMonitor opponentList={opponents} />}
        </div>
    );
}
