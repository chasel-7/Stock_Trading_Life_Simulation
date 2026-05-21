import asyncio
import uuid
import random
from typing import Dict, List, Set, Any
from fastapi import WebSocket

class PVPManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}          # {user_id: websocket}
        self.queue: List[Dict[str, Any]] = []                       # [{"user_id", "elo"}]
        # 房间模型：{match_id: {"seed", "participants": {user_id: {"day", "assets", "is_finished"}}}}
        self.matches: Dict[str, Dict[str, Any]] = {} 
        self.user_to_match: Dict[str, str] = {}                     # {user_id: match_id}

    async def register_connection(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def unregister_connection(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.leave_queue(user_id)

    def join_queue(self, user_id: str, elo: int):
        import time
        # 防重复排队
        if not any(item["user_id"] == user_id for item in self.queue):
            self.queue.append({"user_id": user_id, "elo": elo, "joined_at": time.time()})

    def leave_queue(self, user_id: str):
        self.queue = [item for item in self.queue if item["user_id"] != user_id]

    async def broadcast_to_match(self, match_id: str, message: dict):
        """
        向对局房间内的所有玩家推送状态
        """
        match = self.matches.get(match_id)
        if not match:
            return
        for uid in match["participants"].keys():
            ws = self.active_connections.get(uid)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    # 连接可能断开，静默处理
                    pass

    async def create_match(self, players: list, bots: list = None):
        """
        创建对局房间，建立映射并推送 MATCH_FOUND 通知
        """
        match_id = str(uuid.uuid4())
        seed = f"seed_{random.randint(100000, 999999)}"
        
        participants = {
            item["user_id"]: {"day": 0, "assets": 30000.0, "is_finished": False}
            for item in players
        }
        
        if bots:
            for bot_id in bots:
                participants[bot_id] = {"day": 0, "assets": 30000.0, "is_finished": False}
                
        self.matches[match_id] = {
            "seed": seed,
            "participants": participants
        }
        
        # 建立双向映射，并发通知
        for item in players:
            uid = item["user_id"]
            self.user_to_match[uid] = match_id
            ws = self.active_connections.get(uid)
            if ws:
                try:
                    await ws.send_json({
                        "type": "MATCH_FOUND",
                        "match_id": match_id,
                        "match_seed": seed,
                        "players": list(participants.keys())
                    })
                except Exception:
                    pass

    async def simulate_bot_progress(self, match_id: str, real_player_id: str, player_day: int, player_is_finished: bool):
        """
        根据真实玩家的进度，模拟并推进对局房间中机器人的天数与资产
        """
        match = self.matches.get(match_id)
        if not match:
            return
            
        for p_id, p_data in match["participants"].items():
            if p_id.startswith("bot_"):
                # 如果机器人的天数落后于玩家，进行模拟推进
                if p_data["day"] < player_day:
                    # 每一天机器人的资产变化率在 -5% 到 +8% 之间波动
                    for _ in range(player_day - p_data["day"]):
                        change = random.uniform(-0.05, 0.08)
                        p_data["assets"] = round(p_data["assets"] * (1.0 + change), 2)
                    p_data["day"] = player_day
                    p_data["is_finished"] = player_is_finished
                    
                    # 广播机器人的更新
                    await self.broadcast_to_match(match_id, {
                        "type": "OPPONENT_UPDATE",
                        "user_id": p_id,
                        "day": p_data["day"],
                        "assets": p_data["assets"],
                        "is_finished": p_data["is_finished"]
                    })
                elif player_is_finished and not p_data["is_finished"]:
                    p_data["is_finished"] = True
                    await self.broadcast_to_match(match_id, {
                        "type": "OPPONENT_UPDATE",
                        "user_id": p_id,
                        "day": p_data["day"],
                        "assets": p_data["assets"],
                        "is_finished": p_data["is_finished"]
                    })

    async def poll_matchmaking(self):
        """
        匹配算法：
        1. 优先凑够 2 个真实玩家进行撮合
        2. 如果玩家排队超过 5 秒，自动填充一个 Bot 玩家凑齐 2 人启动对局
        """
        import time
        while True:
            await asyncio.sleep(1)
            if not self.queue:
                continue
                
            now = time.time()
            if len(self.queue) >= 2:
                batch = [self.queue.pop(0) for _ in range(2)]
                await self.create_match(batch)
            elif len(self.queue) == 1 and (now - self.queue[0]["joined_at"] >= 5.0):
                player = self.queue.pop(0)
                bot_id = f"bot_{random.randint(1000, 9999)}"
                await self.create_match([player], bots=[bot_id])
