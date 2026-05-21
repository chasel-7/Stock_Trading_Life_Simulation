from app.services.stock_generator import StockGenerator

def test_deterministic_prices():
    gen1 = StockGenerator("seed_test_123")
    gen2 = StockGenerator("seed_test_123")
    
    # 校验同一只股票同一天生成的最高最低价是否完全一致
    open1, high1, low1 = gen1.get_daily_bounds("科技-01", day=3, initial_base_price=10.0)
    open2, high2, low2 = gen2.get_daily_bounds("科技-01", day=3, initial_base_price=10.0)
    
    assert open1 == open2
    assert high1 == high2
    assert low1 == low2
    
    # 不同股票应有不同价格
    _, high_tech, _ = gen1.get_daily_bounds("科技-01", day=1, initial_base_price=10.0)
    _, high_finance, _ = gen1.get_daily_bounds("金融-01", day=1, initial_base_price=10.0)
    assert high_tech != high_finance
