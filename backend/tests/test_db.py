from app.models.user import User
from app.models.game_record import GameRecord

def test_create_user_and_record(session):
    # 创建用户
    user = User(id="test_openid_123", username="股神测试员")
    session.add(user)
    session.commit()
    session.refresh(user)
    
    assert user.elo_rating == 1200
    
    # 创建游戏记录
    record = GameRecord(
        user_id=user.id,
        role_type="sales_manager",
        final_cash=20000.0,
        final_assets=50000.0,
        profit_rate=1.5,
        transaction_log="[]",
        score_metrics="{}",
        is_verified=True
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    
    assert record.id is not None
    assert record.user_id == "test_openid_123"

def test_game_record_practice_field(session):
    # 创建用户
    user = User(id="test_practice_user", username="练习赛测试员")
    session.add(user)
    session.commit()
    session.refresh(user)

    # 测试能否正常创建含有 is_practice 的记录
    record = GameRecord(
        user_id=user.id,
        role_type="internet_worker",
        match_seed="test_seed",
        final_cash=30000.0,
        final_assets=30000.0,
        profit_rate=0.0,
        transaction_log="[]",
        score_metrics="{}"
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    assert record.is_practice is False

