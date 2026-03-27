from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import json
from datetime import datetime
from websockets.manager import manager
from core.database import get_db
from models.domain import Message, User, Room

router = APIRouter()

@router.websocket("/ws/chat/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str, username: str, db: AsyncSession = Depends(get_db)):
    await manager.connect(room_name, websocket)
    
    # Simple join broadcast
    join_msg = {
        "type": "join",
        "sender": username,
        "room": room_name,
        "time": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_room(room_name, join_msg)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Message processing
            if payload.get("type") == "message":
                text = payload.get("text")
                msg_data = {
                    "type": "message",
                    "sender": username,
                    "text": text,
                    "room": room_name,
                    "time": datetime.utcnow().isoformat()
                }
                
                # Fetch DB Room/User optionally in a real setup before saving
                # (Skipping robust DB checks in the WS loop for brevity/speed)
                # In production, save asynchronously or use a background task.
                
                await manager.broadcast_to_room(room_name, msg_data)

            elif payload.get("type") == "typing":
                typing_msg = {
                    "type": "typing",
                    "sender": username,
                    "room": room_name
                }
                await manager.broadcast_to_room(room_name, typing_msg)

    except WebSocketDisconnect:
        manager.disconnect(room_name, websocket)
        leave_msg = {
            "type": "leave",
            "sender": username,
            "room": room_name,
            "time": datetime.utcnow().isoformat()
        }
        await manager.broadcast_to_room(room_name, leave_msg)
