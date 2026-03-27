from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from core.database import get_db
from models.domain import Room

router = APIRouter(prefix="/rooms", tags=["Rooms"])

class RoomCreate(BaseModel):
    name: str
    description: str | None = None

@router.get("/")
async def list_rooms(db: AsyncSession = Depends(get_db)):
    stmt = select(Room).order_by(Room.name)
    result = await db.execute(stmt)
    rooms = result.scalars().all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in rooms]

@router.post("/")
async def create_room(room: RoomCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Room).where(Room.name == room.name)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Room already exists")
    
    new_room = Room(name=room.name, description=room.description)
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    
    return {"id": new_room.id, "name": new_room.name}
