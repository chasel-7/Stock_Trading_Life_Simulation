def test_login_new_user_and_update(client):
    payload = {
        "id": "wx_openid_test_111",
        "username": "韭菜小张",
        "avatar_url": "http://example.com/avatar.png"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "wx_openid_test_111"
    assert data["username"] == "韭菜小张"
    assert data["avatar_url"] == "http://example.com/avatar.png"
    assert data["elo_rating"] == 1200

    # 2. 已存在用户更新昵称
    payload_update = {
        "id": "wx_openid_test_111",
        "username": "回本散户小张",
        "avatar_url": "http://example.com/avatar2.png"
    }
    response_up = client.post("/api/v1/auth/login", json=payload_update)
    assert response_up.status_code == 200
    data_up = response_up.json()
    assert data_up["id"] == "wx_openid_test_111"
    assert data_up["username"] == "回本散户小张"
    assert data_up["avatar_url"] == "http://example.com/avatar2.png"
