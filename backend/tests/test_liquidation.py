from app.services.verification import VerificationService

def test_verification_negative_cash_margin():
    # 模拟一个进行了第一天杠杆买入，且在第二天卖出平仓使得现金回正的合法日志
    # 种子为: "test_seed"
    # 初始资金：30000.0 (internet_worker)
    
    # Day 1: 买入 3500 股 科技-01，价格为 9.5 元 (Day 1 bounds: Open: 10.03, High: 10.03, Low: 8.22, 9.5 合法)
    # 总成本 = 3500 * 9.5 = 33250.0 + 332.50 (1%手续费) = 33582.50 元
    # 现金变为：30000 - 33582.50 = -3582.50 元
    # 第一日盘后结算：日薪 +800，日常开支 -200
    # 第一日结束现金：-3582.50 + 600 = -2982.50 元
    
    # Day 2: 卖出 600 股 科技-01，价格为 8.0 元 (Day 2 bounds: Open: 8.43, High: 8.93, Low: 7.35, 8.0 合法)
    # 卖出所得 = 600 * 8.0 = 4800.0 - 48.0 (1%手续费) = 4752.0 元
    # 现金变为：-2982.50 + 4752.0 = 1769.50 元
    # 第二日盘后结算：日薪 +800，日常开支 -200
    # 第二日结束现金：1769.50 + 600 = 2369.50 元
    
    # Day 3..15: 保持持仓，每天收支 +600，现金增加 13 * 600 = 7800.0 元
    # 期末现金：2369.50 + 7800 = 10169.50 元
    # 剩余持仓 = 2900 股
    # Day 15 期末收盘价 = 4.31 元，市值 = 2900 * 4.31 = 12499.0 元
    # 最终总资产 = 10169.50 + 12499.0 = 22668.50 元
    
    transaction_log = [
        {"day": 1, "stock": "科技-01", "type": "BUY", "price": 9.5, "qty": 3500},
        {"day": 2, "stock": "科技-01", "type": "SELL", "price": 8.0, "qty": 600}
    ]
    scene_log = []
    
    is_valid = VerificationService.verify_game_log(
        seed="test_seed",
        role_type="internet_worker",
        transaction_log=transaction_log,
        scene_log=scene_log,
        submitted_final_assets=22668.50
    )
    
    assert is_valid is True
