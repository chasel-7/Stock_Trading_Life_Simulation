import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.pvp_manager import PVPManager

router = APIRouter()
pvp_manager = PVPManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await pvp_manager.register_connection(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            action = event.get("action")
            
            if action == "join_queue":
                elo = event.get("elo", 1200)
                pvp_manager.join_queue(user_id, elo)
                await websocket.send_json({"type": "QUEUE_JOINED"})
                
            elif action == "update_status":
                # 更新局内天数和资产
                match_id = pvp_manager.user_to_match.get(user_id)
                if match_id and match_id in pvp_manager.matches:
                    day = event.get("day", 1)
                    assets = event.get("assets", 30000.0)
                    is_finished = event.get("is_finished", False)
                    
                    # 更新内存缓存
                    p_data = pvp_manager.matches[match_id]["participants"][user_id]
                    p_data["day"] = day
                    p_data["assets"] = assets
                    p_data["is_finished"] = is_finished
                    
                    # 广播给同房其他人
                    await pvp_manager.broadcast_to_match(match_id, {
                        "type": "OPPONENT_UPDATE",
                        "user_id": user_id,
                        "day": day,
                        "assets": assets,
                        "is_finished": is_finished
                    })
                    
                    # 模拟推进可能存在的机器人对手
                    await pvp_manager.simulate_bot_progress(match_id, user_id, day, is_finished)
    except WebSocketDisconnect:
        pvp_manager.unregister_connection(user_id)
