from contextlib import asynccontextmanager

from fastapi import FastAPI

from ..provider.base import COLLECTION_NAME
from ..provider._client import client
from server.provider import create_collection


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await create_collection()

    await client.connect()
    _app.question_collection = client.collections.get(COLLECTION_NAME)
    yield
