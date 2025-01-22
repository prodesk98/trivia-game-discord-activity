from typing import Coroutine, Any, Dict, Mapping, List

from pymongo import AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.command_cursor import AsyncCommandCursor
from pymongo.asynchronous.cursor import AsyncCursor
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import DeleteResult

from config import env


class MongoClient(AsyncMongoClient):
    def __init__(self, uri: str):
        super().__init__(uri)
        self.db: AsyncDatabase = self.get_database()

    def get_collection(self, collection: str) -> AsyncCollection:
        return self.db.get_collection(collection)

    async def findOne(self, collection: str, filters: Dict[str, Any]) -> Coroutine[Any, Any, Mapping[str, Any] | None | Any]:
        return self.get_collection(collection).find_one(filter=filters)

    async def findAll(self, collection: str, filters: Dict[str, Any]) -> AsyncCursor[Mapping[str, Any]]:
        return self.get_collection(collection).find(filter=filters)

    async def deleteOne(self, collection: str, filters: Dict[str, Any]) -> DeleteResult:
        return await self.get_collection(collection).delete_one(filter=filters)

    async def deleteAll(self, collection: str, filters: Dict[str, Any]) -> DeleteResult:
        return await self.get_collection(collection).delete_many(filter=filters)

    async def countDocuments(self, collection: str, filters: Dict[str, Any]) -> int:
        return await self.get_collection(collection).count_documents(filter=filters) # noqa

    async def aggregate(
        self,
        collection: str,
        pipeline: List[Dict[str, Any]],
    ) -> List[Mapping[str, Any]]:
        cursor = await self.get_collection(collection).aggregate(pipeline)
        results = []
        async for document in cursor:
            results.append(document)
        return results

    async def distinctCountDocuments(self, collection: str, key: str) -> int:
        resp = await self.aggregate(collection, [
            {"$group": {"_id": f"${key}"}},
            {"$count": "total"}
        ])
        if len(resp) == 0:
            return 0
        return resp[0]["total"]

db = MongoClient(env.MONGODB_DSN)
