import pytest
from fastapi.testclient import TestClient
from main import app

def test_websocket_matchmaking():
    with TestClient(app) as client:
        # 模拟 2 个客户端连接以测试双人匹配
        with client.websocket_connect("/pvp/ws/user_a") as ws_a, \
             client.websocket_connect("/pvp/ws/user_b") as ws_b:
             
            # 两人排队
            ws_a.send_json({"action": "join_queue", "elo": 1200})
            ws_b.send_json({"action": "join_queue", "elo": 1200})
            
            # 验证所有人都会收到排队成功 (QUEUE_JOINED)
            resp_a = ws_a.receive_json()
            assert resp_a["type"] == "QUEUE_JOINED"
            
            resp_b = ws_b.receive_json()
            assert resp_b["type"] == "QUEUE_JOINED"
            
            # 等待广播 MATCH_FOUND
            found_match = False
            for _ in range(5):
                msg = ws_a.receive_json()
                if msg["type"] == "MATCH_FOUND":
                    found_match = True
                    assert len(msg["players"]) == 2
                    assert "user_a" in msg["players"]
                    assert "user_b" in msg["players"]
                    break
            assert found_match is True

def test_websocket_matchmaking_timeout_bot():
    import time
    with TestClient(app) as client:
        # 模拟 1 个客户端连接以测试机器人超时匹配
        with client.websocket_connect("/pvp/ws/user_a") as ws_a:
            # 单人排队
            ws_a.send_json({"action": "join_queue", "elo": 1200})
            
            resp_a = ws_a.receive_json()
            assert resp_a["type"] == "QUEUE_JOINED"
            
            # 等待大约 6 秒（因为超时时间是 5 秒）
            time.sleep(6)
            
            # 验证收到的 MATCH_FOUND，包含了 user_a 和一个 bot 玩家
            found_match = False
            for _ in range(10):
                msg = ws_a.receive_json()
                if msg["type"] == "MATCH_FOUND":
                    found_match = True
                    assert len(msg["players"]) == 2
                    assert "user_a" in msg["players"]
                    assert any(p.startswith("bot_") for p in msg["players"])
                    break
            assert found_match is True
