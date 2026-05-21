from app.services.verification import VerificationService

def test_verification_valid_log():
    # 模拟一个没有买卖，只有基础收支的合规对局 (打工人：30000 初始)
    # 15天日薪 = 15 * 800 = 12000
    # 15天成本 = 15 * 200 = 3000
    # 最终资产应为：30000 + 12000 - 3000 = 39000
    transaction_log = []
    scene_log = []
    
    is_valid = VerificationService.verify_game_log(
        seed="test_seed_999",
        role_type="internet_worker",
        transaction_log=transaction_log,
        scene_log=scene_log,
        submitted_final_assets=39000.0
    )
    assert is_valid is True

def test_verification_cheat_assets():
    # 篡改资产数据（本来应为39000，强行提交为 99999.0）
    is_valid = VerificationService.verify_game_log(
        seed="test_seed_999",
        role_type="internet_worker",
        transaction_log=[],
        scene_log=[],
        submitted_final_assets=99999.0
    )
    assert is_valid is False

def test_verification_freelancer_and_bookstore():
    # 模拟自由职业者日常收支与书店消费的手续费动态重放校验
    from app.services.verification import get_deterministic_salary
    
    # 1. 计算不交易时 15 天的正常终期资产
    cash = 50000.0
    seed = "test_seed_999"
    for day in range(1, 16):
        cash += get_deterministic_salary(seed, day)
        cash -= 150.0 # Freelancer daily cost
    
    # 验证不交易时资产是否正确
    is_valid = VerificationService.verify_game_log(
        seed=seed,
        role_type="freelancer",
        transaction_log=[],
        scene_log=[],
        submitted_final_assets=round(cash, 2)
    )
    assert is_valid is True
    
    # 2. 模拟在 Day 2 去了书店 (spend = 100)，并在 Day 3 买入 1000 股 科技-01 (价格 8.0，在合理波动内)
    # 书店 Buff 在 Day 3 生效，费率为 0.5% * 0.5 = 0.25% (原来为 0.5%)
    cash = 50000.0
    bookstore_days_left = 0
    # Day 1:
    cash += get_deterministic_salary(seed, 1) - 150.0
    # Day 2: 去了书店
    cash -= 100.0 # 书店开销
    bookstore_days_left = 5
    cash += get_deterministic_salary(seed, 2) - 150.0
    bookstore_days_left -= 1 # Day 2 结束，剩余 4
    # Day 3: 买入 (Fee rate: 0.25%)
    fee_rate = 0.005 * 0.5
    cost = 8.0 * 1000
    fee = cost * fee_rate
    cash -= (cost + fee)
    cash += get_deterministic_salary(seed, 3) - 150.0
    bookstore_days_left -= 1 # Day 3 结束，剩余 3
    
    # Day 4-15: 正常度过
    for day in range(4, 16):
        cash += get_deterministic_salary(seed, day) - 150.0
        bookstore_days_left = max(0, bookstore_days_left - 1)
        
    # 期末持仓估值
    from app.services.stock_generator import StockGenerator
    generator = StockGenerator(seed)
    prices, _, _ = generator.generate_prices_for_day("科技-01", 15, 10.0)
    final_price = prices[-1]
    
    expected_assets = round(cash + 1000 * final_price, 2)
    
    transaction_log = [
        {"day": 3, "stock": "科技-01", "type": "BUY", "price": 8.0, "qty": 1000}
    ]
    scene_log = [
        {"day": 2, "scene": "书店", "spend": 100.0}
    ]
    
    is_valid_tx = VerificationService.verify_game_log(
        seed=seed,
        role_type="freelancer",
        transaction_log=transaction_log,
        scene_log=scene_log,
        submitted_final_assets=expected_assets
    )
    assert is_valid_tx is True

