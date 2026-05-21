import json

def test_game_record_radar_scores(client):
    # 注册用户
    user_payload = {"id": "user_radar_test", "username": "雷达图玩家"}
    login_resp = client.post("/api/v1/auth/login", json=user_payload)
    assert login_resp.status_code == 200

    # 提交带有自定义四维评分的合法对局 (使用 internet_worker 保证无随机数漂移，15天累计资金为 39000)
    record_payload = {
        "user_id": "user_radar_test",
        "role_type": "internet_worker",
        "match_seed": "radar_seed_123",
        "final_cash": 39000.0,
        "final_assets": 39000.0,
        "profit_rate": 30.0,
        "transaction_log": [],
        "scene_log": [],
        "score_metrics": {
            "智慧": 70,
            "心态": 95,
            "社交": 80,
            "平衡": 75
        }
    }
    
    response = client.post("/api/v1/game/record", json=record_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True
    
    # 再次查询历史，验证战绩详情记录在数据库中且能被正确拉取
    history_resp = client.get("/api/v1/game/user/user_radar_test/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 1
    
    # 再次登录查看 elo_rating 增加 (30.0 提升 30分)
    user_resp = client.post("/api/v1/auth/login", json=user_payload)
    assert user_resp.json()["elo_rating"] == 1230
