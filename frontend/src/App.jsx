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
import { useToast, ToastContainer } from './components/GameToast';
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
    const tickIntervalRef = useRef(null);

    // 盘前提示信息（打工人或体制内青年专属特权）
    const [pretradeMessage, setPretradeMessage] = useState("");

    // 新增：突发生活事件与晨报、强平报告状态
    const [activeLifeEvent, setActiveLifeEvent] = useState(null);
    const [liquidationReport, setLiquidationReport] = useState(null);
    const [morningBrief, setMorningBrief] = useState(null);
    const [showMorningBrief, setShowMorningBrief] = useState(false);

    // 游戏内 Toast 通知
    const toast = useToast();

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
        tickIntervalRef.current = setInterval(() => {
            setTick((t) => {
                if (t >= 239) {
                    if (tickIntervalRef.current) {
                        clearInterval(tickIntervalRef.current);
                        tickIntervalRef.current = null;
                    }
                    return 239;
                }
                return t + 1;
            });
        }, 150 / (store.tickRateMultiplier || 1.0));
        return () => {
            if (tickIntervalRef.current) {
                clearInterval(tickIntervalRef.current);
                tickIntervalRef.current = null;
            }
        };
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
                toast.show("资产自动强平结束后流动现金依然低于 0，系统判定破产！", "error", 5000);
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
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
        }
        const todayProfit = ((store.assets - startOfDayAssets) / startOfDayAssets) * 100;
        setTodayProfitRate(todayProfit);
        setPhase('NIGHT');
    };

    const selectScene = (scene) => {
        const isSales = store.roleType === 'sales_manager';
        const actualCost = isSales ? scene.cost * 0.8 : scene.cost;

        if (actualCost > 0 && store.cash < actualCost) {
            toast.show("流动现金余额不足，无法进入该消费场景！", "warning");
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
                if (marketData && marketData.stocks) {
                    marketData.stocks.forEach((s) => {
                        currentPricesMap[s] = marketData.prices?.[s]?.[tick] || marketData.bounds?.[s]?.open || 10.0;
                    });
                } else {
                    Object.keys(store.holdings).forEach(s => {
                        currentPricesMap[s] = 10.0;
                    });
                }
                const res = store.runAutoLiquidation(currentPricesMap);
                if (!res.success) {
                    toast.show("第 15 天平仓结束后现金依然低于 0，系统判定破产！", "error", 5000);
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
            <div className="layout-center">
                <div className="game-card" style={{ padding: '40px', maxWidth: '420px', width: '100%', animation: 'cardDrop 0.4s ease forwards' }}>
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🕹️</div>
                        <h2 className="game-logo-title">股票人生模拟器</h2>
                        <div className="game-logo-subtitle">STOCK LIFE ARCADE</div>
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-data)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Player ID</label>
                        <input value={userId} onChange={(e) => setUserId(e.target.value)} className="input-game" placeholder="输入你的专属ID" />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-data)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>昵称 Nickname</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-game" placeholder="起一个响亮的江湖名号" />
                    </div>
                    <button onClick={handleLogin} className="btn-arcade" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>🚪 进入游戏大厅</button>
                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>v2.0 · 所有的选择都有价格</div>
                </div>
            </div>
        );
    }

    if (isMatching) {
        return (
            <div className="layout-center">
                <div className="game-card" style={{ padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', animation: 'cardDrop 0.4s ease forwards' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--amber)', margin: '0 0 8px 0' }}>🔍 搜寻对手中...</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px 0' }}>正在天梯匹配实力相当的散户，请稍候</p>
                    <div className="match-radar" />
                    <p style={{ fontFamily: 'var(--font-data)', fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 20px 0', animation: 'glowPulse 1.5s ease infinite' }}>SEARCHING 4 PLAYERS...</p>
                    <button className="btn-danger" onClick={() => setIsMatching(false)} style={{ padding: '10px 24px' }}>✖ 取消匹配</button>
                </div>
            </div>
        );
    }

    if (!store.isPlaying && phase !== 'SETTLEMENT') {
        return (
            <div className="layout-center" style={{ padding: '30px 20px' }}>
                <div className="game-card" style={{ padding: '32px', maxWidth: '540px', width: '100%', animation: 'cardDrop 0.4s ease forwards' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 4px 0', fontSize: '18px', color: 'var(--text-primary)' }}>🏠 散户大厅</h3>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>欢迎回来, <span style={{ color: 'var(--amber)', fontWeight: '700' }}>{store.user.username}</span></div>
                        </div>
                        <div className="day-pill">⭐ ELO {store.user.elo_rating}</div>
                    </div>
                
                    {/* 职业身份卡片网格 */}
                    <h4 className="section-title">🎭 选择你的职业身份</h4>
                    <div className="grid-2col" style={{ marginBottom: '24px' }}>
                        {ROLE_OPTIONS.map((opt) => {
                            const isSelected = selectedRole === opt.id;
                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => setSelectedRole(opt.id)}
                                    className={`role-card ${isSelected ? 'role-card--selected' : ''}`}
                                >
                                    <span className="role-icon">{opt.icon}</span>
                                    <div className="role-name">{opt.name}</div>
                                    <div className="role-stats">
                                        起薪/天: <span style={{ color: 'var(--text-primary)' }}>¥{opt.salary}</span><br />
                                        日生活费: <span style={{ color: 'var(--text-primary)' }}>¥{opt.cost}</span>
                                    </div>
                                    <div className="role-perk">⚡ {opt.desc}</div>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={startMatchmaking} className="btn-arcade" style={{ width: '100%', padding: '15px', fontSize: '15px', marginBottom: '12px' }}>⚔️ 寻找 PVP 竞技赛 (Elo 匹配)</button>
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
                        className="btn-sky" 
                        style={{ width: '100%', padding: '15px', fontSize: '15px' }}
                    >
                        🎮 开启单人练习赛 (不计天梯分)
                    </button>
                    
                    {history.length > 0 && (
                        <div style={{ marginTop: '24px', borderTop: '2px dashed var(--border-card)', paddingTop: '16px' }}>
                            <h5 className="section-title" style={{ fontSize: '14px' }}>🏆 历史战绩</h5>
                            <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                                {history.map((record) => (
                                    <div key={record.id} className="history-row">
                                        <span style={{ color: 'var(--text-muted)' }}>#{record.id}</span>
                                        <span className={record.is_practice ? 'badge badge--solo' : 'badge badge--pvp'}>{record.is_practice ? '练习' : '竞技'}</span>
                                        <span>{ROLE_OPTIONS.find(r => r.id === record.role_type)?.icon} {ROLE_OPTIONS.find(r => r.id === record.role_type)?.name || record.role_type}</span>
                                        <span style={{ fontFamily: 'var(--font-data)', color: 'var(--text-primary)' }}>¥{record.final_assets.toFixed(0)}</span>
                                        <span className={record.profit_rate >= 0 ? 'text-profit' : 'text-loss'}>{record.profit_rate >= 0 ? '+' : ''}{record.profit_rate.toFixed(1)}%</span>
                                        <span style={{ color: record.is_verified ? 'var(--jade)' : 'var(--crimson)' }}>{record.is_verified ? '✓' : '✗'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 局内行情相关的临时参数
    const currentPrice = marketData?.prices?.[selectedStock]?.[tick] || marketData?.bounds?.[selectedStock]?.open || 10.0;
    const currentHolding = store.holdings[selectedStock] || 0;

    return (
        <div className="layout-page">
            <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
            {phase === 'TRADE' && marketData && (
                <>
                    {/* 盘前职业资讯条 */}
                    {pretradeMessage && (
                        <div className="pretrade-banner">
                            📢 {pretradeMessage}
                        </div>
                    )}

                    {/* 状态看板栏 */}
                    <div className="game-card--static" style={{ padding: '16px', marginBottom: '20px' }}>
                        <div className="hud-bar">
                            <div className="hud-left">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '0 0 6px 0' }}>
                                    <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '16px' }}>{store.isPvpMode ? '⚔️ 竞技赛' : '🎮 练习赛'}</h3>
                                    <span className="day-pill">Day {store.day} / 15</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {ROLE_OPTIONS.find(r => r.id === store.roleType)?.icon} {ROLE_OPTIONS.find(r => r.id === store.roleType)?.name}
                                    {store.bookstoreDaysLeft > 0 && <span className="badge badge--buff" style={{ marginLeft: '8px' }}>📚 手续费减半 {store.bookstoreDaysLeft}天</span>}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    🛡️ 强平策略:
                                    <select 
                                        value={store.liquidationStrategy} 
                                        onChange={(e) => store.setLiquidationStrategy(e.target.value)}
                                        className="input-game"
                                        style={{ width: 'auto', padding: '3px 8px', fontSize: '11px' }}
                                    >
                                        <option value="profit_first">优先卖出浮盈股 (处置效应)</option>
                                        <option value="loss_first">优先卖出浮亏股 (理性止损)</option>
                                        <option value="value_first">优先卖出大市值股 (流动性至上)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="hud-right">
                                <div style={{ fontFamily: 'var(--font-data)', fontSize: '14px', fontWeight: '700' }}>
                                    💰 <span className={store.cash >= 0 ? 'cash-amount cash-amount--positive' : 'cash-amount cash-amount--negative'}>¥{store.cash.toFixed(2)}</span>
                                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>|</span>
                                    📊 <span style={{ color: 'var(--amber)' }}>¥{store.assets.toFixed(2)}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: tick >= 239 ? 'var(--amber)' : 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-data)' }}>
                                    {tick >= 239 ? '📢 已收盘 — 点击进入盘后' : `TICK ${tick}/240${store.tickRateMultiplier > 1.0 ? ' ⚡加速中' : ''}`}
                                </div>
                            </div>
                            <button
                                className="btn-arcade"
                                onClick={handleEndTradeDay}
                                style={{
                                    whiteSpace: 'nowrap',
                                    ...(tick >= 239 ? { animation: 'btnPulse 1.5s ease-in-out infinite', boxShadow: '0 3px 0 var(--amber-dim), 0 0 16px var(--amber-glow)' } : {})
                                }}
                            >🌙 进入盘后</button>
                        </div>
                    </div>

                    {/* 左右核心双栏布局 */}
                    <div className="grid-trade">
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
                            <div className="game-card--static" style={{ padding: '15px', marginTop: '15px' }}>
                                <h4 className="section-title" style={{ fontSize: '14px' }}>📓 情报笔记本</h4>
                                <div className="info-notebook">
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
                                                    <div key={stock} className="info-synthesis">
                                                        💡 <strong>【情报串联 - {stock}】</strong>: 经过 {Array.from(sources).join(' & ')} 交叉研判，确信该股有庄家或机构资金建仓迹象！
                                                    </div>
                                                );
                                            }
                                        });
                                        
                                        return syntheses.length > 0 ? syntheses : null;
                                    })()}
                                    
                                    {store.gatheredInfo.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px 0' }}>暂无盘后情报，多去大排档/酒吧社交收集线索吧。</div>
                                    ) : (
                                        store.gatheredInfo.map((info, idx) => (
                                            <div key={idx} className="info-entry">
                                                🔍 [{info.source}] <span style={{ color: 'var(--amber)', fontWeight: 'bold' }}>{info.stock}</span>: {info.text}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 右侧：当前选中股详情看盘及交易 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <h4 className="section-title" style={{ fontSize: '14px', marginBottom: '8px' }}>📈 走势：<span style={{ fontFamily: 'var(--font-data)', color: 'var(--amber)' }}>{selectedStock}</span></h4>
                                <KLineChart
                                    prices={marketData.prices[selectedStock]?.slice(0, tick + 1) || [10.0]}
                                    history={store.dailyPricesHistory[selectedStock] || []}
                                />
                            </div>

                            {store.meetingForceEnd && tick >= 180 && (
                                <div className="meeting-lockout">
                                    💼 正在召开部门紧急会议 (14:00 后)，交易功能已被强制停用。请认真参会！
                                </div>
                            )}

                            <StockRow
                                stockName={selectedStock}
                                price={currentPrice}
                                holdingQty={currentHolding}
                                onTrade={(type, qty) => {
                                    if (store.meetingForceEnd && tick >= 180) {
                                        toast.show("此时正是下午部门紧急会议时间，请认真听取领导发言，严禁偷偷进行股票买卖！", "warning");
                                        return;
                                    }
                                    if (type === 'BUY') {
                                        const success = store.buyStock(selectedStock, currentPrice, qty);
                                        if (!success) toast.show("可用负现金授信已达上限，无法买入！", "error");
                                    }
                                    if (type === 'SELL') {
                                        const success = store.sellStock(selectedStock, currentPrice, qty);
                                        if (!success) toast.show("持仓股份不足，无法卖出！", "error");
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
            )}

            {phase === 'NIGHT' && (
                <div className="game-card" style={{ padding: '28px', textAlign: 'center', maxWidth: '520px', margin: '40px auto', animation: 'cardDrop 0.35s ease forwards' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 6px 0', fontSize: '20px', color: 'var(--amber)' }}>🌃 盘后社交阶段</h3>
                    <span className="day-pill" style={{ marginBottom: '16px', display: 'inline-flex' }}>Day {store.day}</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '12px 0 4px 0' }}>
                        今日收益率: <span className={todayProfitRate >= 0 ? 'text-profit' : 'text-loss'} style={{ fontSize: '18px' }}>
                            {todayProfitRate >= 0 ? '+' : ''}{todayProfitRate.toFixed(2)}%
                        </span>
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>根据今日损益解锁以下场景，选择你的夜生活：</p>
                    <div className="grid-2col">
                        {getUnlockedScenes(todayProfitRate)
                            .filter((scene) => {
                                const isSales = store.roleType === 'sales_manager';
                                const displayCost = isSales ? scene.cost * 0.8 : scene.cost;
                                // 0花费场景始终允许，有花费场景要求流动现金足够
                                return displayCost === 0 || store.cash >= displayCost;
                            })
                            .map((scene) => {
                                const isSales = store.roleType === 'sales_manager';
                                const displayCost = isSales ? scene.cost * 0.8 : scene.cost;
                                return (
                                    <div
                                        key={scene.name}
                                        className="scene-card"
                                        onClick={() => selectScene(scene)}
                                    >
                                        <div className="scene-name">{scene.name}</div>
                                        <div className="scene-cost">
                                            💰 ¥{displayCost}
                                            {isSales && scene.cost > 0 ? " (8折)" : ""}
                                        </div>
                                    </div>
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
                <div className="game-card" style={{ padding: '30px', maxWidth: '850px', margin: '40px auto', textAlign: 'center', animation: 'cardDrop 0.4s ease forwards' }}>
                    <h2 className="settlement-title" style={{ color: 'var(--amber)' }}>{store.isPvpMode ? '⚔️ STAGE CLEAR' : '🎮 GAME OVER'}</h2>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{store.isPvpMode ? '竞技赛终局结算' : '练习赛终局结算'}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 25px 0', fontFamily: 'var(--font-data)' }}>
                        VERIFY: {settlementReport.isVerified ? 
                            <span className="text-profit">PASSED ✓</span> : 
                            <span className="text-loss">REJECTED ✗</span>
                        }
                    </p>

                    {settlementReport.isBankrupt && (
                        <div style={{ color: 'var(--crimson)', fontFamily: 'var(--font-display)', fontSize: '18px', margin: '10px 0 20px 0', padding: '12px', background: 'rgba(232, 55, 90, 0.06)', border: '2px dashed var(--crimson)', borderRadius: 'var(--radius-md)' }}>
                            💀 破产清算 — 流动现金彻底归零！
                        </div>
                    )}

                    <div className="settlement-grid">
                        {/* 左侧：雷达图与排名 */}
                        <div>
                            <h4 className="section-title">📊 四维交易表现</h4>
                            <RadarChart scores={settlementReport.metrics} />

                            {/* ELO Rating Badge */}
                            <div style={{ background: 'var(--bg-elevated)', padding: '14px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-card)' }}>
                                {store.isPvpMode ? (
                                    <>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', textTransform: 'uppercase' }}>Elo Rating</div>
                                            <div style={{ fontSize: '13px', marginTop: '3px', fontFamily: 'var(--font-data)' }}>
                                                {settlementReport.oldElo} ➔ <span style={{ fontWeight: 'bold', color: 'var(--amber)' }}>{settlementReport.newElo}</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="elo-change-badge" 
                                            style={{ color: settlementReport.eloDiff >= 0 ? 'var(--jade)' : 'var(--crimson)' }}
                                        >
                                            {settlementReport.eloDiff >= 0 ? `+${settlementReport.eloDiff}` : settlementReport.eloDiff}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', textTransform: 'uppercase' }}>Elo Rating</div>
                                            <div style={{ fontSize: '13px', marginTop: '3px', color: 'var(--sky)' }}>
                                                🎮 练习赛 (不计积分)
                                            </div>
                                        </div>
                                        <div style={{ color: 'var(--sky)', fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-data)' }}>—</div>
                                    </>
                                )}
                            </div>

                            {/* Leaderboard */}
                            <h4 className="section-title">🏁 本场排行</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {settlementReport.leaderboard.map((player, idx) => {
                                    const isSelf = player.userId === store.user.id;
                                    return (
                                        <div key={player.userId} className={`leaderboard-row ${isSelf ? 'leaderboard-row--self' : ''}`}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className="rank-medal">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                                </span>
                                                <span style={{ fontWeight: isSelf ? 'bold' : 'normal' }}>{player.username}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-data)', color: 'var(--amber)' }}>¥{player.assets.toFixed(0)}</div>
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                                    {player.isFinished ? '✓ 完赛' : '进行中...'}
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
                                <h4 className="section-title" style={{ color: 'var(--crimson)' }}>
                                    🧠 认知偏差诊断
                                </h4>
                                {settlementReport.biases.length === 0 ? (
                                    <div className="bias-card bias-card--clean">
                                        🎉 <strong>完美克制偏见！</strong> 本局无明显交易行为偏差，心态平稳，理性克制！
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                                        {settlementReport.biases.map((bias) => (
                                            <div key={bias.id} className="bias-card">
                                                <div className="bias-name">{bias.name}</div>
                                                <p style={{ margin: '6px 0 8px 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{bias.desc}</p>
                                                <div className="bias-tip">{bias.tip}</div>
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
                        className="btn-arcade" 
                        onClick={() => {
                            useGameStore.setState({ isPlaying: false });
                            setPhase('TRADE');
                            setSettlementReport(null);
                        }}
                        style={{ width: '100%', padding: '14px', marginTop: '30px', fontSize: '16px' }}
                    >
                        🏠 返回散户大厅
                    </button>
                </div>
            )}

            {/* 突发生活随机事件弹窗 */}
            {phase === 'LIFE_EVENT' && activeLifeEvent && (
                <div className="modal-overlay">
                    <div className="modal-panel modal-panel--amber">
                        <span style={{ fontSize: '36px', display: 'block', marginBottom: '4px' }}>❗</span>
                        <h3 style={{ fontFamily: 'var(--font-display)', margin: '8px 0 15px 0', color: 'var(--amber)', fontSize: '18px' }}>{activeLifeEvent.title}</h3>
                        <div className="speech-bubble" style={{ marginBottom: '20px' }}>
                            {activeLifeEvent.desc}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activeLifeEvent.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className="btn-arcade"
                                    onClick={() => {
                                        if (opt.cost && (store.cash - opt.cost < -store.assets)) {
                                            toast.show("您的流动资金与授信资产已全部耗尽，信用额度爆仓，系统判定直接破产！", "error", 5000);
                                            setActiveLifeEvent(null);
                                            handleSettlement(true);
                                            return;
                                        }
                                        const feedback = opt.effect(store);
                                        toast.show(feedback || "事件已处理完毕", "success");
                                        setActiveLifeEvent(null);
                                        finalizeDayTransition();
                                    }}
                                    style={{ padding: '10px', fontSize: '13px' }}
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
                <div className="modal-overlay">
                    <div className="modal-panel modal-panel--danger">
                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--crimson)', margin: '0 0 10px 0', fontSize: '18px' }}>⚠️ 自动清仓报告</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            流动现金透支 (<span className="text-loss">¥{store.cash.toFixed(2)}</span>)，系统已强制平仓。
                        </p>
                        <div style={{ margin: '15px 0', maxHeight: '180px', overflowY: 'auto' }}>
                            <table className="game-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>股票</th>
                                        <th>平仓价格</th>
                                        <th>股数</th>
                                        <th style={{ textAlign: 'right' }}>回笼资金</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liquidationReport.map((log, idx) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'left', fontFamily: 'var(--font-data)' }}>{log.stock}</td>
                                            <td style={{ fontFamily: 'var(--font-data)' }}>¥{log.price.toFixed(2)}</td>
                                            <td style={{ fontFamily: 'var(--font-data)' }}>{log.qty}</td>
                                            <td style={{ textAlign: 'right' }} className="text-profit">+¥{log.revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', margin: '15px 0', fontFamily: 'var(--font-data)' }}>
                            平仓后现金：<span className="text-profit">¥{store.cash.toFixed(2)}</span>
                        </div>
                        <button className="btn-arcade" onClick={() => setLiquidationReport(null)} style={{ width: '100%', padding: '10px' }}>
                            ✓ 确认并继续
                        </button>
                    </div>
                </div>
            )}

            {/* 盘前推演晨报 */}
            {showMorningBrief && morningBrief && (
                <div className="modal-overlay">
                    <div className="modal-panel modal-panel--amber">
                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--amber)', margin: '0 0 6px 0', fontSize: '18px' }}>📢 盘前晨报</h3>
                        <span className="day-pill" style={{ display: 'inline-flex', marginBottom: '16px' }}>Day {morningBrief.day}</span>
                        <div style={{ margin: '10px 0', textAlign: 'left', fontSize: '13px', lineHeight: '1.7' }}>
                            <div style={{ marginBottom: '12px' }}>
                                🔥 <strong>今日活跃板块：</strong> 
                                <span className="badge badge--buff" style={{ marginLeft: '6px' }}>
                                    {morningBrief.activeSector}
                                </span>
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                📈 <strong>主力推荐：</strong> 
                                <span style={{ color: 'var(--amber)', marginLeft: '6px', fontWeight: 'bold', fontFamily: 'var(--font-data)' }}>{morningBrief.recommendations.join(', ')}</span>
                            </div>
                            {morningBrief.extraHint && (
                                <div style={{ borderTop: '1px dashed var(--border-card)', paddingTop: '10px', color: 'var(--amber)', fontSize: '12px' }}>
                                    {morningBrief.extraHint}
                                </div>
                            )}
                        </div>
                        <button className="btn-arcade" onClick={() => setShowMorningBrief(false)} style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                            🕹️ 开始操盘
                        </button>
                    </div>
                </div>
            )}

            {/* PVP 联机同步看板 */}
            {phase !== 'SETTLEMENT' && store.isPvpMode && <PVPMonitor opponentList={opponents} />}
        </div>
    );
}
