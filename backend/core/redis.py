import asyncio
import redis.asyncio as aioredis
from core.config import settings

# Global Redis client
redis_client = None

async def init_redis():
    global redis_client
    redis_client = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)

async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
