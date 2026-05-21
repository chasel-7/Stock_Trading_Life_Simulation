/**
 * 股票交易人生模拟器 - 行为偏见与四维评分计算引擎
 */

/**
 * 诊断交易员的投资偏见 (Cognitive Biases)
 * @param {Array} transactionLog - 交易记录 [{"day", "stock", "type", "price", "qty"}]
 * @param {Object} dailyPricesHistory - 每日收盘历史 {"科技-01": [day1Close, day2Close, ...]}
 * @returns {Array} 诊断出的偏见列表 [{"id", "name", "desc", "tip"}]
 */
export function diagnoseBiases(transactionLog, dailyPricesHistory) {
    const biases = [];
    if (!transactionLog || transactionLog.length === 0) return biases;

    // 1. 追涨杀跌检测器 (Chase Rise & Fall Detector)
    let chaseBuys = 0;
    let panicSells = 0;
    let totalBuys = 0;
    let totalSells = 0;

    transactionLog.forEach((tx) => {
        const { day, stock, type, price } = tx;
        const history = dailyPricesHistory[stock] || [];
        
        // 我们需要至少前两天的历史价格趋势来判断追涨杀跌
        // 例如：若交易发生在 Day D，则 history 应存有 Day 1 至 Day D-1 的收盘价
        // 故 history 中至少需要有 2 天以上的记录
        const prevDayIdx = day - 2; // Day D 的前一天收盘价对应索引是 D-2
        if (prevDayIdx >= 1) {
            const pPrev1 = history[prevDayIdx];      // 前一天收盘价
            const pPrev3 = history[prevDayIdx - 2] || history[0]; // 前三天收盘价 (防止越界)
            
            if (pPrev3 > 0) {
                const returnPrevDays = (pPrev1 - pPrev3) / pPrev3;
                
                if (type === "BUY") {
                    totalBuys++;
                    // 如果买入前2天内价格大幅上涨超过 5%，判定为追涨买入
                    if (returnPrevDays > 0.05) {
                        chaseBuys++;
                    }
                } else if (type === "SELL") {
                    totalSells++;
                    // 如果卖出前2天内价格大幅下跌超过 -5%，判定为杀跌卖出
                    if (returnPrevDays < -0.05) {
                        panicSells++;
                    }
                }
            }
        }
    });

    const chaseBuyRatio = totalBuys > 0 ? chaseBuys / totalBuys : 0;
    const panicSellRatio = totalSells > 0 ? panicSells / totalSells : 0;

    // 触发阈值：交易笔数不少于 4 笔且追涨/杀跌比例过半
    if (transactionLog.length >= 4 && (chaseBuyRatio >= 0.5 || panicSellRatio >= 0.5)) {
        biases.push({
            id: "chase_rise_fall",
            name: "🔥 追涨杀跌 (Chase Rise & Fall)",
            desc: "您极易受到股价波动的短期情绪干扰。在上涨时因贪婪恐高或强行踏空而高位追高，在下跌时因极度恐惧在底部仓促割肉。",
            tip: "建议：制定明确的交易计划和进出场价格区间，不要在分时线急速上涨或下跌时手动下单，采用分批建仓与止盈止损单。"
        });
    }

    // 2. 损失厌恶与沉没成本检测器 (Loss Aversion & Sunk Cost Detector)
    // 重建每日持仓与损益表现
    const holdingPeriods = {}; // { stock: { buyPrice, buyDay, qty, lossDays: 0 } }
    let hasSunkCostDeadHold = false;
    let profitableHoldingsDurations = [];

    // 仿真重构持仓天数
    for (let currentDay = 1; currentDay <= 15; currentDay++) {
        // 当天交易
        const dayTxs = transactionLog.filter(tx => tx.day === currentDay);
        dayTxs.forEach(tx => {
            const { stock, type, price, qty } = tx;
            if (type === "BUY") {
                if (!holdingPeriods[stock]) {
                    holdingPeriods[stock] = { buyPrice: price, buyDay: currentDay, qty: qty, lossDays: 0 };
                } else {
                    const holding = holdingPeriods[stock];
                    const totalQty = holding.qty + qty;
                    if (totalQty > 0) {
                        holding.buyPrice = (holding.buyPrice * holding.qty + price * qty) / totalQty;
                    }
                    holding.qty = totalQty;
                }
            } else if (type === "SELL") {
                const holding = holdingPeriods[stock];
                if (holding) {
                    if (price > holding.buyPrice) {
                        profitableHoldingsDurations.push(currentDay - holding.buyDay);
                    }
                    holding.qty -= qty;
                    if (holding.qty <= 0.001) {
                        delete holdingPeriods[stock];
                    }
                }
            }
        });

        // 检查当天持有中个股的浮动亏损
        Object.entries(holdingPeriods).forEach(([stock, holding]) => {
            const history = dailyPricesHistory[stock] || [];
            // 获取当天收盘价
            const currentDayClose = history[currentDay - 1] || holding.buyPrice;
            const floatingLoss = (currentDayClose - holding.buyPrice) / holding.buyPrice;
            
            if (floatingLoss <= -0.30) {
                holding.lossDays++;
                // 浮亏比例超过 30% 且持有天数超过 5 天依然拒绝止损
                if (holding.lossDays >= 5) {
                    hasSunkCostDeadHold = true;
                }
            }
        });
    }

    const avgProfitableHold = profitableHoldingsDurations.length > 0 
        ? profitableHoldingsDurations.reduce((a,b) => a+b, 0) / profitableHoldingsDurations.length 
        : 0;

    // 如果有过死扛 30% 亏损的经历，且止盈股票持有平均短于 2 天（或根本没有过盈利出局操作），触发损失厌恶与沉没成本偏差
    if (hasSunkCostDeadHold && (profitableHoldingsDurations.length === 0 || avgProfitableHold <= 2)) {
        biases.push({
            id: "loss_aversion",
            name: "📉 损失厌恶与沉没成本 (Loss Aversion & Sunk Cost)",
            desc: "您符合行为金融学经典的“处置效应”：赚钱的股票稍微上涨就急于卖出落袋为安，亏钱的股票却因为害怕承认损失而死扛不卖，最终导致小赚大亏。",
            tip: "建议：建立严格的单笔亏损止损边界（如 10% - 15% 自动平仓），同时让浮盈股票的利润飞一会，拒绝让感情战胜理性的数学期望。"
        });
    }

    // 3. 过度交易检测器 (Overtrading Detector)
    if (transactionLog.length > 20) {
        biases.push({
            id: "overtrading",
            name: "⚡ 过度交易 (Overtrading / Churning)",
            desc: "您的日均交易频率极高。频繁进出折腾导致您付出了高昂的手续费与印花税，消磨了资金效率，也更容易在瞬息万变的分时行情中迷失节奏。",
            tip: "建议：管住手，减少每天的操作次数。把精力放在高确定性的逻辑研判上，记住‘多做多错，不做不错’也是一种防守境界。"
        });
    }

    return biases;
}

/**
 * 整合计算最终结算的四维雷达图得分
 * @param {number} profitRate - 累积投资收益率
 * @param {Array} transactionLog - 交易记录
 * @param {Array} sceneLog - 消费记录
 * @param {Array} gatheredInfo - 收集到的情报
 * @param {Array} biases - 诊断出的偏见列表
 * @param {boolean} hasLiquidated - 对局中是否遭遇过赤字清仓强平
 * @returns {Object} { 智慧, 心态, 社交, 平衡 }
 */
export function calculateRadarMetrics(profitRate, transactionLog, sceneLog, gatheredInfo, biases, hasLiquidated) {
    // 1. 投资智慧: 由收益率直接驱动
    let wisdom = Math.floor(50 + profitRate);
    wisdom = Math.max(10, Math.min(100, wisdom));

    // 2. 心态稳定: 受交易次数、强平、偏见扣分影响
    let mindset = 95;
    // 交易过多扣分
    const txDeduction = Math.min(30, Math.floor(transactionLog.length * 1.5));
    mindset -= txDeduction;
    // 触发偏见扣分
    if (biases.some(b => b.id === "chase_rise_fall")) mindset -= 15;
    if (biases.some(b => b.id === "loss_aversion")) mindset -= 15;
    if (biases.some(b => b.id === "overtrading")) mindset -= 10;
    mindset = Math.max(15, Math.min(100, mindset));

    // 3. 社交回报: 由场景消费次数、情报合成判定
    let social = 50;
    // 每次场景消费增加 8 分，最高加 40 分
    const sceneBonus = Math.min(40, sceneLog.length * 8);
    social += sceneBonus;
    
    // 是否发生过情报合成
    const grouped = {};
    (gatheredInfo || []).forEach(info => {
        if (!grouped[info.stock]) grouped[info.stock] = [];
        grouped[info.stock].push(info.source);
    });
    const hasSynthesis = Object.values(grouped).some(sources => new Set(sources).size >= 2);
    if (hasSynthesis) {
        social += 15;
    }
    social = Math.max(20, Math.min(100, social));

    // 4. 生活平衡: 衡量消费支出比例与强平惩罚
    let balance = 60;
    const totalSpend = sceneLog.reduce((sum, item) => sum + item.spend, 0);
    // 消费总额拉动，每消费 1000 元加 3 分，上限 30 分
    const spendBonus = Math.min(30, Math.floor(totalSpend / 1000) * 3);
    balance += spendBonus;
    // 如果遭遇过强制平仓，说明生活现金流失控，扣除 25 分
    if (hasLiquidated) {
        balance -= 25;
    }
    balance = Math.max(10, Math.min(100, balance));

    return {
        "投资智慧": wisdom,
        "心态稳定": mindset,
        "社交回报": social,
        "生活平衡": balance
    };
}
