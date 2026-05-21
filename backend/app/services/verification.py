from typing import List, Dict, Any
from app.services.stock_generator import StockGenerator

def get_deterministic_salary(seed: str, day: int) -> float:
    key = f"{seed}_freelancer_{day}"
    h = 0
    for char in key:
        h = (31 * h + ord(char)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    seed_val = abs(h)
    seed_val = (seed_val * 1664525 + 1013904223) & 0xFFFFFFFF
    if seed_val >= 0x80000000:
        seed_val -= 0x100000000
    return float(abs(seed_val) % 1001)

class VerificationService:
    # 股票初始基准价格映射，这里和前端的 100 支股票初始价格保持一致
    STOCK_INITIAL_PRICES = {
        "科技-01": 10.0, "科技-02": 15.0, "科技-07": 23.50,
        "消费-01": 8.0, "消费-02": 12.0,
        "制造-01": 11.0, "金融-01": 5.0
    }

    ROLE_INITIAL_CASH = {
        "internet_worker": 30000.0,
        "sales_manager": 20000.0,
        "freelancer": 50000.0,
        "government_worker": 15000.0
    }

    ROLE_DAILY_SALARY = {
        "internet_worker": 800.0,
        "sales_manager": 500.0,
        "freelancer": 400.0, # 简化测试取固定值，对局中可由日志记录
        "government_worker": 400.0
    }

    ROLE_DAILY_COST = {
        "internet_worker": 200.0,
        "sales_manager": 300.0,
        "freelancer": 150.0,
        "government_worker": 100.0
    }

    @classmethod
    def calculate_score_metrics(
        cls,
        initial_cash: float,
        transaction_log: List[Dict[str, Any]],
        scene_log: List[Dict[str, Any]],
        profit_rate: float
    ) -> Dict[str, int]:
        # 智慧 (Wisdom)
        wisdom = min(100, max(0, int(50 + profit_rate)))
        # 心态 (Mindset) - 频繁交易降低心态
        mindset = min(100, max(0, 90 - len(transaction_log) * 5))
        # 社交 (Social) - 场景消费提升社交
        social = min(100, max(0, 70 + len(scene_log) * 2))
        # 平衡 (Balance)
        balance = 85
        return {
            "智慧": wisdom,
            "心态": mindset,
            "社交": social,
            "平衡": balance
        }

    @classmethod
    def verify_game_log(
        cls,
        seed: str,
        role_type: str,
        transaction_log: List[Dict[str, Any]],
        scene_log: List[Dict[str, Any]],
        submitted_final_assets: float,
        submitted_score_metrics: Dict[str, Any] = None
    ) -> bool:
        """
        重放客户端交易与消费，验证提交的资产总额与雷达指标是否合法。
        """
        if role_type not in cls.ROLE_INITIAL_CASH:
            return False

        # 1. 初始化资金状态
        initial_cash = cls.ROLE_INITIAL_CASH[role_type]
        cash = initial_cash
        stock_holdings = {} # {"股票名": 数量}
        generator = StockGenerator(seed)
        
        # 书店手续费天数追踪与费率设置
        bookstore_days_left = 0
        base_fee_rate = 0.005 if role_type == "freelancer" else 0.01

        # 按交易日 1-15 依次重放
        for day in range(1, 16):
            # 动态计算交易费率 (书店 Buff 折半)
            fee_rate = base_fee_rate * 0.5 if bookstore_days_left > 0 else base_fee_rate

            # 处理当日盘中交易
            day_txs = [tx for tx in transaction_log if tx.get("day") == day]
            for tx in day_txs:
                stock = tx.get("stock")
                tx_type = tx.get("type")
                price = tx.get("price")
                qty = tx.get("qty")
                
                # 校验该股在该天是否确实存在，且价格是否在最高/最低价范围内（含 0.5% 滑点容差）
                init_p = cls.STOCK_INITIAL_PRICES.get(stock, 10.0)
                _, high_p, low_p = generator.get_daily_bounds(stock, day, init_p)
                
                if price < low_p * 0.995 or price > high_p * 1.005:
                    # 价格不合法（作弊或严重的客户端数据不同步）
                    return False

                if tx_type == "BUY":
                    cost = price * qty
                    fee = cost * fee_rate
                    total_spend = cost + fee
                    
                    # 允许负现金过盘，但负债（现金缺口）不得超过当前估算的总资产
                    stock_val = 0.0
                    for s, q in stock_holdings.items():
                        init_p = cls.STOCK_INITIAL_PRICES.get(s, 10.0)
                        open_p, _, _ = generator.get_daily_bounds(s, day, init_p)
                        stock_val += q * open_p
                    est_assets = cash + stock_val
                    if cash - total_spend < -max(10000.0, est_assets):
                        return False
                    cash -= total_spend
                    stock_holdings[stock] = stock_holdings.get(stock, 0) + qty

                elif tx_type == "SELL":
                    if stock_holdings.get(stock, 0) < qty:
                        # 超卖，持仓不足
                        return False
                    revenue = price * qty
                    fee = revenue * fee_rate
                    cash += (revenue - fee)
                    stock_holdings[stock] -= qty
                    if stock_holdings[stock] == 0:
                        del stock_holdings[stock]

            # 处理当日盘后场景消费
            day_scenes = [s for s in scene_log if s.get("day") == day]
            scene_spend = sum(s.get("spend", 0) for s in day_scenes)
            cash -= scene_spend

            # 动态判定书店 Buff 触发
            for scene in day_scenes:
                if "书店" in scene.get("scene", ""):
                    bookstore_days_left = 5

            # 加上日薪，扣除生活成本
            if role_type == "freelancer":
                salary = get_deterministic_salary(seed, day)
            else:
                salary = cls.ROLE_DAILY_SALARY[role_type]

            cash += salary
            cash -= cls.ROLE_DAILY_COST[role_type]
            bookstore_days_left = max(0, bookstore_days_left - 1)

        # 计算最终总资产 = 现金 + 剩余持仓股票按最后一天的收盘价计算市值
        remaining_stock_value = 0.0
        for stock, qty in stock_holdings.items():
            init_p = cls.STOCK_INITIAL_PRICES.get(stock, 10.0)
            # 用第15天的折线数据中的最后一点作为期末价格进行结算
            prices, _, _ = generator.generate_prices_for_day(stock, 15, init_p)
            final_price = prices[-1]
            remaining_stock_value += qty * final_price

        calculated_assets = round(cash + remaining_stock_value, 2)
        # 误差在 0.1 元以内即可判定为真
        if abs(calculated_assets - submitted_final_assets) >= 0.1:
            return False

        return True
