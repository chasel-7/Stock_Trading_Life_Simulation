import { create } from 'zustand';

// 32-bit signed integer pseudo-random generator
function getDeterministicSalary(seed, day) {
    const key = `${seed}_freelancer_${day}`;
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
    }
    let seedVal = Math.abs(h);
    seedVal = (Math.imul(seedVal, 1664525) + 1013904223) | 0;
    return Math.abs(seedVal) % 1001;
}

export const useGameStore = create((set, get) => ({
    user: null,
    isPlaying: false,
    day: 1,
    cash: 30000.0,
    assets: 30000.0,
    holdings: {},          // {"科技-01": 数量}
    avgHoldCosts: {},      // {"科技-01": 均价}
    transactionLog: [],    // [{"day", "stock", "type", "price", "qty"}]
    sceneLog: [],          // [{"day", "scene", "spend"}]
    isPvpMode: false,
    matchSeed: "default_seed",
    roleType: "internet_worker",
    bookstoreDaysLeft: 0,  // 书店手续费减免天数
    liquidationStrategy: "profit_first", // "profit_first" | "loss_first" | "value_first"
    gatheredInfo: [],      // [{"stock", "source", "text", "type"}]
    pendingRepayments: [], // [{"dueDay", "amount"}]
    tickRateMultiplier: 1.0,
    dailyPricesHistory: {}, // {"科技-01": [day1Close, day2Close, ...]}
    hasLiquidated: false,
    meetingForceEnd: false,

    setUser: (user) => set({ user }),
    setMeetingForceEnd: (force) => set({ meetingForceEnd: force }),
    setLiquidationStrategy: (strategy) => set({ liquidationStrategy: strategy }),
    addInfoHint: (hint) => set((state) => ({ gatheredInfo: [...state.gatheredInfo, hint] })),
    addRepayment: (repayment) => set((state) => ({ pendingRepayments: [...state.pendingRepayments, repayment] })),
    setTickRateMultiplier: (multiplier) => set({ tickRateMultiplier: multiplier }),
    recordDailyPrices: (bounds) => set((state) => {
        const newHistory = { ...state.dailyPricesHistory };
        Object.entries(bounds).forEach(([stock, bound]) => {
            if (!newHistory[stock]) newHistory[stock] = [];
            if (newHistory[stock].length < state.day) {
                newHistory[stock].push(bound.close);
            }
        });
        return { dailyPricesHistory: newHistory };
    }),
    
    startGame: (seed, role, isPvp = false) => {
        let initialCash = 30000.0;
        if (role === "sales_manager") initialCash = 20000.0;
        if (role === "freelancer") initialCash = 50000.0;
        if (role === "government_worker") initialCash = 15000.0;

        set({
            isPlaying: true,
            isPvpMode: isPvp,
            day: 1,
            cash: initialCash,
            assets: initialCash,
            holdings: {},
            avgHoldCosts: {},
            transactionLog: [],
            sceneLog: [],
            matchSeed: seed,
            roleType: role,
            bookstoreDaysLeft: 0,
            liquidationStrategy: "profit_first",
            gatheredInfo: [],
            pendingRepayments: [],
            tickRateMultiplier: 1.0,
            dailyPricesHistory: {},
            hasLiquidated: false,
            meetingForceEnd: false
        });
    },
    
    buyStock: (stock, price, qty) => {
        const cost = price * qty;
        const baseFeeRate = get().roleType === 'freelancer' ? 0.005 : 0.01;
        const feeRate = get().bookstoreDaysLeft > 0 ? baseFeeRate * 0.5 : baseFeeRate;
        const fee = cost * feeRate;
        const totalCost = cost + fee;
        
        // 允许现金归负，但最大允许负债不超过当前的总资产（即允许2倍杠杆）
        if (get().cash - totalCost < -get().assets) return false;
        
        set((state) => {
            const currentQty = state.holdings[stock] || 0;
            const oldAvgCost = state.avgHoldCosts[stock] || 0;
            
            const newQty = currentQty + qty;
            const newAvgCost = ((currentQty * oldAvgCost) + (price * qty)) / newQty;
            
            const newHoldings = { ...state.holdings, [stock]: newQty };
            const newAvgCosts = { ...state.avgHoldCosts, [stock]: parseFloat(newAvgCost.toFixed(2)) };
            const logEntry = { day: state.day, stock, type: "BUY", price, qty };
            
            return {
                cash: state.cash - totalCost,
                holdings: newHoldings,
                avgHoldCosts: newAvgCosts,
                transactionLog: [...state.transactionLog, logEntry]
            };
        });
        get().updateAssets(price); // 刷新总资产
        return true;
    },
    
    sellStock: (stock, price, qty) => {
        const currentQty = get().holdings[stock] || 0;
        if (currentQty < qty) return false;
        
        const revenue = price * qty;
        const baseFeeRate = get().roleType === 'freelancer' ? 0.005 : 0.01;
        const feeRate = get().bookstoreDaysLeft > 0 ? baseFeeRate * 0.5 : baseFeeRate;
        const fee = revenue * feeRate;
        
        set((state) => {
            const newHoldings = { ...state.holdings, [stock]: currentQty - qty };
            const newAvgCosts = { ...state.avgHoldCosts };
            
            if (newHoldings[stock] === 0) {
                delete newHoldings[stock];
                delete newAvgCosts[stock];
            }
            const logEntry = { day: state.day, stock, type: "SELL", price, qty };
            return {
                cash: state.cash + (revenue - fee),
                holdings: newHoldings,
                avgHoldCosts: newAvgCosts,
                transactionLog: [...state.transactionLog, logEntry]
            };
        });
        get().updateAssets(price);
        return true;
    },

    addSceneSpend: (sceneName, spend) => {
        const isSales = get().roleType === 'sales_manager';
        const isSocialScene = !["更换家电支出", "开会奖金", "摸鱼罚款", "项目分红", "借款给亲友"].includes(sceneName);
        const actualSpend = (isSales && isSocialScene && spend > 0) ? spend * 0.8 : spend;

        set((state) => {
            const nextBookstoreDays = sceneName.includes("书店") ? 5 : state.bookstoreDaysLeft;
            return {
                cash: state.cash - actualSpend,
                sceneLog: [...state.sceneLog, { day: state.day, scene: sceneName, spend: actualSpend }],
                bookstoreDaysLeft: nextBookstoreDays
            };
        });
    },

    nextDay: () => set((state) => {
        let salary = 0;
        let cost = 0;
        if (state.roleType === 'internet_worker') {
            salary = 800;
            cost = 200;
        } else if (state.roleType === 'sales_manager') {
            salary = 500;
            cost = 300;
        } else if (state.roleType === 'freelancer') {
            salary = getDeterministicSalary(state.matchSeed, state.day);
            cost = 150;
        } else if (state.roleType === 'government_worker') {
            salary = 400;
            cost = 100;
        }
        
        // 处理到期还款
        const nextDayNum = state.day + 1;
        let repaidCash = 0;
        const remainingRepayments = [];
        for (const repayment of state.pendingRepayments) {
            if (repayment.dueDay === nextDayNum) {
                repaidCash += repayment.amount;
            } else {
                remainingRepayments.push(repayment);
            }
        }
        
        return {
            day: nextDayNum,
            cash: state.cash + salary - cost + repaidCash,
            pendingRepayments: remainingRepayments,
            bookstoreDaysLeft: Math.max(0, state.bookstoreDaysLeft - 1),
            meetingForceEnd: false
        };
    }),

    runAutoLiquidation: (currentPriceMap) => {
        if (get().cash >= 0) return { success: true, log: [] };
        
        const strategy = get().liquidationStrategy;
        const holdings = get().holdings;
        const avgHoldCosts = get().avgHoldCosts;
        const baseFeeRate = get().roleType === 'freelancer' ? 0.005 : 0.01;
        const feeRate = get().bookstoreDaysLeft > 0 ? baseFeeRate * 0.5 : baseFeeRate;
        
        const stockList = Object.keys(holdings);
        if (stockList.length === 0) {
            return { success: false, log: [] };
        }
        
        const sortedStocks = stockList.sort((a, b) => {
            const priceA = currentPriceMap[a] || 0;
            const priceB = currentPriceMap[b] || 0;
            const costA = avgHoldCosts[a] || priceA;
            const costB = avgHoldCosts[b] || priceB;
            
            const profitRateA = (priceA - costA) / costA;
            const profitRateB = (priceB - costB) / costB;
            
            if (strategy === "profit_first") {
                return profitRateB - profitRateA;
            } else if (strategy === "loss_first") {
                return profitRateA - profitRateB;
            } else {
                const valA = holdings[a] * priceA;
                const valB = holdings[b] * priceB;
                return valB - valA;
            }
        });
        
        const liquidationLogs = [];
        let currentCash = get().cash;
        
        for (const stock of sortedStocks) {
            if (currentCash >= 0) break;
            
            const qty = holdings[stock];
            const price = currentPriceMap[stock] || 0;
            if (price <= 0 || qty <= 0) continue;
            
            const neededCash = -currentCash;
            const priceAfterFee = price * (1 - feeRate);
            let sellQty = Math.ceil(neededCash / priceAfterFee);
            if (sellQty > qty) {
                sellQty = qty;
            }
            
            const success = get().sellStock(stock, price, sellQty);
            if (success) {
                liquidationLogs.push({
                    stock,
                    price,
                    qty: sellQty,
                    revenue: sellQty * priceAfterFee
                });
                currentCash = get().cash;
            }
        }
        
        const success = currentCash >= 0;
        if (liquidationLogs.length > 0) {
            set({ hasLiquidated: true });
        }
        return { success, log: liquidationLogs };
    },

    updateAssets: (currentPriceMap) => {
        set((state) => {
            let stockVal = 0;
            for (const [stock, qty] of Object.entries(state.holdings)) {
                const price = typeof currentPriceMap === 'number' ? currentPriceMap : (currentPriceMap[stock] || 0);
                stockVal += qty * price;
            }
            return { assets: state.cash + stockVal };
        });
    }
}));
