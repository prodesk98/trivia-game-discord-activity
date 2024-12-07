from typing import Optional

from loguru import logger
from weaviate.classes.query import MetadataQuery
from weaviate.collections import CollectionAsync
from weaviate.collections.classes.internal import QueryReturn

from weaviate.types import UUID

from .schemas import QuestionSchema


async def create_question(data: QuestionSchema, c: CollectionAsync) -> Optional[UUID]:
    try:
        return await c.data.insert(
            dict(
                document_id=data.document_id,
                question=data.question,
                options=data.options,
                answer=data.answer,
                category=data.category.value,
                difficulty=data.difficulty.value,
            ),
            uuid=data.document_id,
        )
    except Exception as e:
        logger.error(f"Error creating question: {e}")


async def query_question(query: str, c: CollectionAsync) -> Optional[QueryReturn]:
    try:
        return await c.query.near_text(
            query=query,
            limit=1,
            return_metadata=MetadataQuery(distance=True)
        )
    except Exception as e:
        logger.error(f"Error querying question: {e}")

