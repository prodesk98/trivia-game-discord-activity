from weaviate.collections import Collection

from server.provider import db, acount_documents

from prometheus_client import Counter, Gauge


USERS_COLLECTION = "users"
ROOMS_COLLECTION = "rooms"
SCORES_COLLECTION = "scores"
GUILDS_COLLECTION = "guilds"


async def get_count_users() -> int:
    result = await db.countDocuments(USERS_COLLECTION, {})
    return result


async def get_count_online_users() -> int:
    return await db.countDocuments(USERS_COLLECTION, {"isOnline": True})


async def get_count_rooms() -> int:
    return await db.countDocuments(ROOMS_COLLECTION, {})


async def get_scores() -> int:
    return await db.countDocuments(SCORES_COLLECTION, {})


async def get_guilds() -> int:
    return await db.distinctCountDocuments(GUILDS_COLLECTION, "guildId")


async def get_count_questions(c: Collection) -> int:
    return await acount_documents(c)
