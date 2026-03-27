import asyncio
import json
from typing import Dict, List
from fastapi import WebSocket
from core.redis import redis_client

class ConnectionManager:
    def __init__(self):
        # Room -> List of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Pub/Sub background tasks
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
            # Start a Redis subscriber for this room if it's the first connection
            self.pubsub_tasks[room] = asyncio.create_task(self._subscribe_room(room))
        self.active_connections[room].append(websocket)

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_connections and websocket in self.active_connections[room]:
            self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]
                # Cancel the pubsub task for this room if empty
                if room in self.pubsub_tasks:
                    self.pubsub_tasks[room].cancel()
                    del self.pubsub_tasks[room]

    async def broadcast_to_room(self, room: str, message: dict):
        # Publish the message to Redis instead of sending directly
        # All instances listening to `room:{room_id}` will receive it
        if redis_client:
            await redis_client.publish(f"room:{room}", json.dumps(message))

    async def _subscribe_room(self, room: str):
        # Async background worker listening for Redis messages on a specific channel
        if not redis_client:
            return
            
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"room:{room}")
        try:
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    data = message['data']
                    # Broadcast to all local websocket connections in this room
                    if room in self.active_connections:
                        for connection in self.active_connections[room]:
                            try:
                                await connection.send_text(data)
                            except Exception:
                                pass # Disconnection handled in main WS loop
        except asyncio.CancelledError:
            await pubsub.unsubscribe(f"room:{room}")

manager = ConnectionManager()
