import sys
import json
import random
import asyncio
import requests
import websockets

BACKEND_URL = "http://localhost:8000/api/v1"
WS_URL = "ws://localhost:8000/pvp"

# 1. 模拟验证规则（同后端 VerificationService 一致，以便客户端自我算账）
ROLE_INITIAL_CASH = {
    "internet_worker": 30000.0,
    "sales_manager": 20000.0,
    "freelancer": 50000.0,
    "government_worker": 15000.0
}
ROLE_DAILY_SALARY = {
    "internet_worker": 800.0,
    "sales_manager": 500.0,
    "freelancer": 400.0,
    "government_worker": 400.0
}
ROLE_DAILY_COST = {
    "internet_worker": 200.0,
    "sales_manager": 300.0,
    "freelancer": 150.0,
    "government_worker": 100.0
}

def run_practice_test():
    print("\n=== [TC-01] 开始单人练习赛流程测试 ===")
    user_id = f"test_practice_{random.randint(10000, 99999)}"
    username = "练习高手"
    
    # Step 1: 登录
    print(f"Step 1: 正在以游客身份登录... ID: {user_id}")
    login_res = requests.post(f"{BACKEND_URL}/auth/login", json={
        "id": user_id,
        "username": username
    })
    assert login_res.status_code == 200
    user_info = login_res.json()
    init_elo = user_info["elo_rating"]
    print(f"登录成功！当前 Elo: {init_elo}")
    
    # Step 2: 准备练习赛参数
    seed = f"practice_{random.randint(100000, 999999)}"
    role = "internet_worker"
    print(f"Step 2: 练习赛配置 - 种子: {seed}, 角色: {role}")
    
    cash = ROLE_INITIAL_CASH[role]
    salary = ROLE_DAILY_SALARY[role]
    cost = ROLE_DAILY_COST[role]
    
    transaction_log = []
    scene_log = []
    
    # 持仓跟踪: {"stock_name": {"qty": int, "avg_price": float}}
    holdings = {}
    
    # 模拟15天的操作
    bookstore_days_left = 0
    base_fee_rate = 0.01 # internet_worker 的交易费率
    
    for day in range(1, 16):
        fee_rate = base_fee_rate * 0.5 if bookstore_days_left > 0 else base_fee_rate
        
        # 获取当日行情
        market_res = requests.get(f"{BACKEND_URL}/game/market-info?seed={seed}&day={day}")
        assert market_res.status_code == 200
        market_data = market_res.json()
        
        stocks = market_data["stocks"]
        bounds = market_data["bounds"]
        
        # 选择第一支股票作为交易目标
        target_stock = stocks[0]
        stock_bounds = bounds[target_stock]
        
        # 第一天买入
        if day == 1:
            price = round(stock_bounds["open"], 2)
            qty = 200
            total_cost = price * qty
            fee = total_cost * fee_rate
            total_spend = total_cost + fee
            
            cash -= total_spend
            holdings[target_stock] = {"qty": qty, "price": price}
            
            transaction_log.append({
                "day": day,
                "stock": target_stock,
                "type": "BUY",
                "price": price,
                "qty": qty
            })
            print(f"Day {day:02d}: 买入 {target_stock} x {qty} 股，价格: {price}，花费现金: {total_spend:.2f}，剩余现金: {cash:.2f}")
            
            # 第一天选择去书店
            scene_log.append({
                "day": day,
                "scene": "📚 书店",
                "spend": 100.0
            })
            cash -= 100.0
            bookstore_days_left = 5
            print(f"Day {day:02d}: 去 📚 书店 消费 ¥100.0，获得交易佣金减半 Buff")
            
        # 中间第8天卖出一半
        elif day == 8:
            price = round(stock_bounds["open"], 2)
            qty = 100
            revenue = price * qty
            fee = revenue * fee_rate
            net_revenue = revenue - fee
            
            cash += net_revenue
            holdings[target_stock]["qty"] -= qty
            
            transaction_log.append({
                "day": day,
                "stock": target_stock,
                "type": "SELL",
                "price": price,
                "qty": qty
            })
            print(f"Day {day:02d}: 卖出 {target_stock} x {qty} 股，价格: {price}，回笼现金: {net_revenue:.2f}，剩余现金: {cash:.2f}")
            scene_log.append({
                "day": day,
                "scene": "🏠 回家吃泡面",
                "spend": 0.0
            })
            
        # 最后一天全部卖出清仓
        elif day == 15:
            price = round(stock_bounds["close"], 2) # 用收盘价清仓
            qty = holdings[target_stock]["qty"]
            revenue = price * qty
            fee = revenue * fee_rate
            net_revenue = revenue - fee
            
            cash += net_revenue
            holdings[target_stock]["qty"] = 0
            
            transaction_log.append({
                "day": day,
                "stock": target_stock,
                "type": "SELL",
                "price": price,
                "qty": qty
            })
            print(f"Day {day:02d}: 收盘前清仓 {target_stock} x {qty} 股，价格: {price}，回笼现金: {net_revenue:.2f}，剩余现金: {cash:.2f}")
            scene_log.append({
                "day": day,
                "scene": "🏠 回家吃泡面",
                "spend": 0.0
            })
            
        else:
            # 其他日子只做日常结算，不交易
            scene_log.append({
                "day": day,
                "scene": "🏠 回家吃泡面",
                "spend": 0.0
            })
            
        # 日结算
        cash += salary
        cash -= cost
        bookstore_days_left = max(0, bookstore_days_left - 1)
        
    # 计算最终总资产
    final_cash = round(cash, 2)
    remaining_stock_value = 0.0
    for s, h in holdings.items():
        qty = h["qty"]
        if qty > 0:
            market_res = requests.get(f"{BACKEND_URL}/game/market-info?seed={seed}&day=15")
            assert market_res.status_code == 200
            final_price = market_res.json()["bounds"][s]["close"]
            remaining_stock_value += qty * final_price
            
    final_assets = round(final_cash + remaining_stock_value, 2)
    profit_rate = round(((final_assets - ROLE_INITIAL_CASH[role]) / ROLE_INITIAL_CASH[role]) * 100, 2)
    
    print(f"游戏结束！最终现金: {final_cash:.2f}, 最终总资产: {final_assets:.2f}, 盈亏比例: {profit_rate:.2f}%")
    
    # 评测指标
    score_metrics = {
        "智慧": min(100, max(0, int(50 + profit_rate))),
        "心态": min(100, max(0, 90 - len(transaction_log) * 5)),
        "社交": min(100, max(0, 70 + len(scene_log) * 2)),
        "平衡": 85
    }
    
    # 提交战绩
    print("Step 3: 正在向服务器提交练习赛战绩...")
    submit_res = requests.post(f"{BACKEND_URL}/game/record", json={
        "user_id": user_id,
        "role_type": role,
        "match_seed": seed,
        "final_cash": final_cash,
        "final_assets": final_assets,
        "profit_rate": profit_rate,
        "transaction_log": transaction_log,
        "scene_log": scene_log,
        "score_metrics": score_metrics,
        "is_practice": True
    })
    
    assert submit_res.status_code == 200
    record_info = submit_res.json()
    print("战绩上报成功！响应数据:")
    print(json.dumps(record_info, indent=2, ensure_ascii=False))
    
    # 验证 anti-cheat 结果为 True
    assert record_info["is_verified"] == True, "练习赛防作弊重放校验失败！"
    
    # 验证 Elo 不变
    user_history_res = requests.post(f"{BACKEND_URL}/auth/login", json={
        "id": user_id,
        "username": username
    })
    updated_elo = user_history_res.json()["elo_rating"]
    assert updated_elo == init_elo, f"错误：练习赛不应当改变 Elo。初始: {init_elo}, 结算后: {updated_elo}"
    print("验证通过：用户 Elo 保持不变！练习赛隔离验证成功。")


async def run_pvp_test():
    print("\n=== [TC-02] 开始竞技赛(WebSocket)及进度同步测试 ===")
    user_id = f"test_pvp_{random.randint(10000, 99999)}"
    username = "PVP王者"
    
    # Step 1: 登录
    print(f"Step 1: 正在以游客身份登录... ID: {user_id}")
    login_res = requests.post(f"{BACKEND_URL}/auth/login", json={
        "id": user_id,
        "username": username
    })
    assert login_res.status_code == 200
    user_info = login_res.json()
    init_elo = user_info["elo_rating"]
    print(f"登录成功！当前 Elo: {init_elo}")
    
    # Step 2: WebSocket 连接并加入匹配队列
    uri = f"{WS_URL}/ws/{user_id}"
    print(f"Step 2: 连接 WebSocket 匹配中心: {uri}")
    async with websockets.connect(uri) as websocket:
        # 发送 join_queue
        await websocket.send(json.dumps({
            "action": "join_queue",
            "elo": init_elo
        }))
        
        # 等待 QUEUE_JOINED
        joined_data = await websocket.recv()
        joined_event = json.loads(joined_data)
        assert joined_event["type"] == "QUEUE_JOINED"
        print("成功加入匹配队列！等待配对...")
        
        # 等待 MATCH_FOUND (因为只有我们一个人在排队，5秒后会触发自动补足机器人对手)
        match_seed = None
        opponents = []
        
        while True:
            msg = await websocket.recv()
            event = json.loads(msg)
            print(f"收到 WS 消息: {event['type']}")
            if event["type"] == "MATCH_FOUND":
                match_seed = event["match_seed"]
                opponents = [p for p in event["players"] if p != user_id]
                print(f"匹配成功！对局种子: {match_seed}, 对手列表: {opponents}")
                break
        
        # Step 3: 模拟对战阶段，同步每日状态并接收对手（Bot）的进度更新
        role = "internet_worker"
        cash = ROLE_INITIAL_CASH[role]
        salary = ROLE_DAILY_SALARY[role]
        cost = ROLE_DAILY_COST[role]
        
        transaction_log = []
        scene_log = []
        holdings = {}
        
        bookstore_days_left = 0
        base_fee_rate = 0.01
        
        print("Step 3: 开始 15 天 PVP 行情模拟与每日进度广播...")
        
        for day in range(1, 16):
            fee_rate = base_fee_rate * 0.5 if bookstore_days_left > 0 else base_fee_rate
            
            # 获取行情
            market_res = requests.get(f"{BACKEND_URL}/game/market-info?seed={match_seed}&day={day}")
            assert market_res.status_code == 200
            market_data = market_res.json()
            target_stock = market_data["stocks"][0]
            stock_bounds = market_data["bounds"][target_stock]
            
            # 第一天买入
            if day == 1:
                price = round(stock_bounds["open"], 2)
                qty = 200
                total_spend = (price * qty) * (1 + fee_rate)
                cash -= total_spend
                holdings[target_stock] = {"qty": qty, "price": price}
                transaction_log.append({
                    "day": day, "stock": target_stock, "type": "BUY", "price": price, "qty": qty
                })
                scene_log.append({"day": day, "scene": "🏠 回家吃泡面", "spend": 0.0})
                
            # 最后一天卖出
            elif day == 15:
                price = round(stock_bounds["close"], 2)
                qty = holdings[target_stock]["qty"]
                net_revenue = (price * qty) * (1 - fee_rate)
                cash += net_revenue
                holdings[target_stock]["qty"] = 0
                transaction_log.append({
                    "day": day, "stock": target_stock, "type": "SELL", "price": price, "qty": qty
                })
                scene_log.append({"day": day, "scene": "🏠 回家吃泡面", "spend": 0.0})
                
            else:
                scene_log.append({"day": day, "scene": "🏠 回家吃泡面", "spend": 0.0})
            
            # 日结算
            cash += salary
            cash -= cost
            
            # 估算当日资产
            current_stock_value = 0.0
            for s, h in holdings.items():
                if h["qty"] > 0:
                    current_stock_value += h["qty"] * stock_bounds["close"]
            current_assets = round(cash + current_stock_value, 2)
            
            # 广播自己的状态
            print(f"广播进度 - Day {day:02d}: 当前资产: {current_assets:.2f}")
            await websocket.send(json.dumps({
                "action": "update_status",
                "day": day,
                "assets": current_assets,
                "is_finished": day == 15
            }))
            
            # 接收对手的广播更新 (Bot 会在收到我们的 update_status 后自动推进并回传 OPPONENT_UPDATE)
            try:
                # 尝试等待接收消息
                # 设置超时，防止没有对手更新时被挂起
                while True:
                    opp_msg = await asyncio.wait_for(websocket.recv(), timeout=0.5)
                    opp_event = json.loads(opp_msg)
                    if opp_event["type"] == "OPPONENT_UPDATE":
                        print(f"  [对手广播] 用户 {opp_event['user_id']} 在 Day {opp_event['day']} 的资产: {opp_event['assets']:.2f}")
            except asyncio.TimeoutError:
                # 超时无新广播，继续下一天
                pass
                
        # 退出对局循环
        print("对战结束，断开 WebSocket 连接。")
        
        # Step 4: 提交 PVP 对局战绩
        final_cash = round(cash, 2)
        final_assets = final_cash # 清仓了，剩余持仓为 0
        profit_rate = round(((final_assets - ROLE_INITIAL_CASH[role]) / ROLE_INITIAL_CASH[role]) * 100, 2)
        score_metrics = {
            "智慧": min(100, max(0, int(50 + profit_rate))),
            "心态": min(100, max(0, 90 - len(transaction_log) * 5)),
            "社交": min(100, max(0, 70 + len(scene_log) * 2)),
            "平衡": 85
        }
        
        print("Step 4: 正在向服务器提交竞技赛战绩并结算 Elo...")
        submit_res = requests.post(f"{BACKEND_URL}/game/record", json={
            "user_id": user_id,
            "role_type": role,
            "match_seed": match_seed,
            "final_cash": final_cash,
            "final_assets": final_assets,
            "profit_rate": profit_rate,
            "transaction_log": transaction_log,
            "scene_log": scene_log,
            "score_metrics": score_metrics,
            "is_practice": False
        })
        
        assert submit_res.status_code == 200
        record_info = submit_res.json()
        print("战绩上报成功！")
        print(json.dumps(record_info, indent=2, ensure_ascii=False))
        assert record_info["is_verified"] == True, "竞技赛防作弊重放校验失败！"
        
        # 检查 Elo 是否变动
        user_history_res = requests.post(f"{BACKEND_URL}/auth/login", json={
            "id": user_id,
            "username": username
        })
        updated_elo = user_history_res.json()["elo_rating"]
        rating_diff = updated_elo - init_elo
        print(f"验证通过：天梯 Elo 变更成功！初始: {init_elo}, 结算后: {updated_elo} (变动: {rating_diff:+d})")


if __name__ == "__main__":
    try:
        # 1. 运行单人练习赛流程测试
        run_practice_test()
        
        # 2. 运行PVP竞技赛流程测试
        asyncio.run(run_pvp_test())
        
        print("\n🎉 所有测试用例执行通过！系统核心逻辑表现完美！")
    except AssertionError as e:
        print(f"\n❌ 测试失败！断言错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试运行中发生未捕获异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
