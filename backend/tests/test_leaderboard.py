import json
from app.models.user import User
from app.models.game_record import GameRecord

def test_leaderboard_endpoint(client, session):
    # 1. Register users in db directly
    user1 = User(id="player_lead_1", username="领头羊1", elo_rating=1200)
    user2 = User(id="player_lead_2", username="领头羊2", elo_rating=1200)
    session.add(user1)
    session.add(user2)
    session.commit()

    # 2. Insert records directly with is_verified=True
    record1 = GameRecord(
        user_id="player_lead_1",
        role_type="internet_worker",
        match_seed="seed_lead_1",
        final_cash=45000.0,
        final_assets=45000.0,
        profit_rate=50.0,
        transaction_log="[]",
        score_metrics=json.dumps({"投资智慧": 50, "心态稳定": 60, "社交回报": 60, "生活平衡": 50}),
        is_verified=True,
        is_practice=False
    )
    record2 = GameRecord(
        user_id="player_lead_2",
        role_type="internet_worker",
        match_seed="seed_lead_2",
        final_cash=36000.0,
        final_assets=36000.0,
        profit_rate=20.0,
        transaction_log="[]",
        score_metrics=json.dumps({"投资智慧": 90, "心态稳定": 90, "社交回报": 90, "生活平衡": 90}),
        is_verified=True,
        is_practice=False
    )
    session.add(record1)
    session.add(record2)
    session.commit()

    # 3. Test profit leaderboard
    resp_profit = client.get("/api/v1/leaderboard?type=profit")
    assert resp_profit.status_code == 200
    profit_data = resp_profit.json()
    assert len(profit_data) == 2
    assert profit_data[0]["user_id"] == "player_lead_1"
    assert profit_data[0]["score"] == 50.0
    assert profit_data[1]["user_id"] == "player_lead_2"
    assert profit_data[1]["score"] == 20.0

    # 4. Test overall leaderboard
    resp_overall = client.get("/api/v1/leaderboard?type=overall")
    assert resp_overall.status_code == 200
    overall_data = resp_overall.json()
    assert len(overall_data) == 2
    assert overall_data[0]["user_id"] == "player_lead_2"
    assert overall_data[0]["score"] == 90.0
    assert overall_data[0]["detail"]["心态稳定"] == 90
    assert overall_data[1]["user_id"] == "player_lead_1"
    assert overall_data[1]["score"] == 55.0
