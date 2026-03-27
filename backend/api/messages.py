from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.domain import Message, Room, User

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.get("/{room_id}")
async def get_messages(room_id: int, limit: int = 50, db: AsyncSession = Depends(get_db)):
    # Verify room exists
    stmt = select(Room).where(Room.id == room_id)
    result = await db.execute(stmt)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Room not found")

    stmt = select(Message, User.username).join(User, Message.sender_id == User.id).where(Message.room_id == room_id).order_by(Message.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    # Reversing to chronological order for chat view
    messages = [{"id": msg.id, "text": msg.text, "sender": username, "time": msg.created_at.isoformat()} for msg, username in reversed(res.all())]
    return messages
