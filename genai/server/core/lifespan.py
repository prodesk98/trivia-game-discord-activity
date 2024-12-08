from contextlib import asynccontextmanager

from fastapi import FastAPI

from ..provider.constraints import COLLECTION_NAME
from ..provider._client import vecdbClient
from server.provider import create_collection


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await create_collection()

    await vecdbClient.connect()
    _app.question_collection = vecdbClient.collections.get(COLLECTION_NAME)
    yield
