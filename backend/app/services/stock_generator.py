import random
from typing import Dict, List, Tuple

class StockGenerator:
    def __init__(self, seed: str):
        self.random = random.Random(seed)
        
    def generate_daily_prices(self, stock_name: str, day: int, base_price: float) -> Tuple[List[float], float, float]:
        """
        生成指定股票在某一天的 240 个分时数据点，并返回分时折线、当日最高价和当日最低价。
        使用 deterministic random 确保相同种子生成一致数据。
        """
        # 使用股票名+天数做哈希子种子，保证不同股不同天的随机性是确定且独立的
        sub_seed = f"{stock_name}_{day}"
        local_rand = random.Random(sub_seed)
        
        prices = []
        current_price = base_price
        high_price = base_price
        low_price = base_price
        
        # 随机游走算法 (Random Walk with Bias)
        # 假设波动幅度在 -1.5% 到 +1.5% 之间
        for _ in range(240):
            change_percent = local_rand.uniform(-0.015, 0.015)
            current_price = current_price * (1 + change_percent)
            current_price = round(max(0.1, current_price), 2)
            prices.append(current_price)
            
            if current_price > high_price:
                high_price = current_price
            if current_price < low_price:
                low_price = current_price
                
        return prices, high_price, low_price

    def generate_prices_for_day(self, stock_name: str, target_day: int, initial_base_price: float) -> Tuple[List[float], float, float]:
        base_price = initial_base_price
        prices = []
        high = base_price
        low = base_price
        for d in range(1, target_day + 1):
            prices, high, low = self.generate_daily_prices(stock_name, d, base_price)
            base_price = prices[-1] # 昨日收盘价
        return prices, high, low

    def get_daily_bounds(self, stock_name: str, day: int, initial_base_price: float) -> Tuple[float, float, float]:
        """
        快速获取某股票某天的 开盘/最高/最低价，用于后端交易价格合法性验证
        """
        base_price, high, low = self.generate_prices_for_day(stock_name, day, initial_base_price)
        return base_price[0], high, low

    @classmethod
    def get_selected_stocks(cls, seed: str) -> List[str]:
        # 按照种子挑选15支股票
        local_rand = random.Random(seed)
        categories = ["消费", "科技", "制造", "医药", "金融"]
        selected = []
        for cat in categories:
            all_cat_stocks = [f"{cat}-{i:02d}" for i in range(1, 21)]
            selected.extend(local_rand.sample(all_cat_stocks, 3))
        return selected

