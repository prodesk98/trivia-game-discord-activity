from typing import Optional, List

from loguru import logger
from weaviate.classes.query import MetadataQuery
from weaviate.collections import CollectionAsync, Collection
from weaviate.collections.classes.internal import QueryReturn

from weaviate.types import UUID

from .schemas import QuestionSchema



_SCORE_THRESHOLD = 0.2


def query_score(query: str, c: Collection) -> Optional[float]:
    try:
        result: QueryReturn = c.query.near_text(
            query=query,
            limit=1,
            return_metadata=MetadataQuery(distance=True)
        )
        if len(result.objects) == 0:
            return 1.
        return next(iter(result.objects)).metadata.distance
    except Exception as e:
        logger.error(f"Error querying question: {e}")


def create_questionaries(data: List[QuestionSchema], c: Collection) -> Optional[List[UUID]]:
    _results = []
    for d in data:
        _score = query_score(query=d.question, c=c)
        if _score is None:
            continue
        if _score < _SCORE_THRESHOLD:
            continue
        logger.info(d)
        logger.info(f"Score: {_score}")
        _results.append(
            c.data.insert(
                dict(
                    document_id=d.document_id,
                    question=d.question,
                    options=d.options,
                    answer=d.answer,
                    category=d.category.value,
                    difficulty=d.difficulty.value,
                    language=d.language,
                ),
                uuid=d.document_id,
            )
        )
    return _results


async def acreate_question(data: QuestionSchema, c: CollectionAsync) -> Optional[UUID]:
    try:
        return await c.data.insert(
            dict(
                document_id=data.document_id,
                question=data.question,
                options=data.options,
                answer=data.answer,
                category=data.category.value,
                difficulty=data.difficulty.value,
                language=data.language,
            ),
            uuid=data.document_id,
        )
    except Exception as e:
        logger.error(f"Error creating question: {e}")


async def aquery_question(query: str, c: CollectionAsync) -> Optional[QueryReturn]:
    try:
        return await c.query.near_text(
            query=query,
            limit=1,
            return_metadata=MetadataQuery(distance=True)
        )
    except Exception as e:
        logger.error(f"Error querying question: {e}")

