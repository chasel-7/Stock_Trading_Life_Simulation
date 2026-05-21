def test_create_and_query_record(client):
    # 1. 尝试提交不存在的用户的战绩 -> 404
    record_payload = {
        "user_id": "non_existent_user_id",
        "role_type": "internet_worker",
        "match_seed": "test_seed_abc",
        "final_cash": 39000.0,
        "final_assets": 39000.0,
        "profit_rate": 30.0,
        "transaction_log": [],
        "scene_log": [],
        "score_metrics": {"智慧": 80, "心态": 90, "社交": 70, "平衡": 85}
    }
    response = client.post("/api/v1/game/record", json=record_payload)
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

    # 2. 正常注册用户，并提交通过校验的战绩
    user_payload = {"id": "user_verify_test", "username": "待检测股神"}
    client.post("/api/v1/auth/login", json=user_payload)

    record_payload["user_id"] = "user_verify_test"
    response_ok = client.post("/api/v1/game/record", json=record_payload)
    assert response_ok.status_code == 200
    data = response_ok.json()
    assert data["id"] is not None
    assert data["user_id"] == "user_verify_test"
    assert data["is_verified"] is True

    # 验证积分因通过校验获得提升：1200 + 30 = 1230
    response_user = client.post("/api/v1/auth/login", json=user_payload)
    assert response_user.json()["elo_rating"] == 1230

    # 3. 伪造作弊数据包提交
    cheat_payload = record_payload.copy()
    cheat_payload["final_assets"] = 99999.0
    response_cheat = client.post("/api/v1/game/record", json=cheat_payload)
    assert response_cheat.status_code == 200
    data_cheat = response_cheat.json()
    assert data_cheat["is_verified"] is False

    # 验证该用户的积分被处罚：扣除 100 点 (1230 -> 1130)
    response_user = client.post("/api/v1/auth/login", json=user_payload)
    assert response_user.json()["elo_rating"] == 1130

    # 4. 拉取历史战绩列表
    response_history = client.get("/api/v1/game/user/user_verify_test/history")
    assert response_history.status_code == 200
    history = response_history.json()
    assert len(history) == 2
    assert history[0]["is_verified"] is True
    assert history[1]["is_verified"] is False

def test_practice_record_submission(client):
    # 1. 正常注册用户，初始 ELO 默认为 1200
    user_payload = {"id": "practice_player_123", "username": "练习生"}
    client.post("/api/v1/auth/login", json=user_payload)

    # 2. 提交练习赛记录 (is_practice=True, 即使收益率高 ELO 也不应变化)
    record_payload = {
        "user_id": "practice_player_123",
        "role_type": "internet_worker",
        "match_seed": "practice_seed_999",
        "final_cash": 39000.0,
        "final_assets": 39000.0,
        "profit_rate": 30.0,
        "transaction_log": [],
        "scene_log": [],
        "score_metrics": {"智慧": 80, "心态": 90, "社交": 70, "平衡": 85},
        "is_practice": True
    }
    response = client.post("/api/v1/game/record", json=record_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_practice"] is True

    # 3. 验证该用户的积分没有变化，依然为 1200
    response_user = client.post("/api/v1/auth/login", json=user_payload)
    assert response_user.json()["elo_rating"] == 1200

