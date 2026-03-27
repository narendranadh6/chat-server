from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.database import init_db
from core.redis import init_redis, close_redis

from api.users import router as users_router
from api.rooms import router as rooms_router
from api.messages import router as messages_router
from api.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    print("🚀 Starting FastAPI backend...")
    await init_db()
    await init_redis()
    print("✅ connected to DB and Redis")
    yield
    # Shutdown Events
    print("🛑 Shutting down FastAPI backend...")
    await close_redis()
    print("✅ Disconnected from Redis")

app = FastAPI(title="Scalable Chat Backend (Python)", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(users_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(chat_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
