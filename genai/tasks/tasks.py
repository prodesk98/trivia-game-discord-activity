from typing import Dict

from ._client import app
from ._vectordb import vecdbClient
from server.provider.vecdb import create_questionaries
from server.provider.constraints import COLLECTION_NAME
from server.provider.schemas import QuestionSchema
from server.core.schemas import Questionnaire
from loguru import logger


_collection_questionnaires = vecdbClient.collections.get(COLLECTION_NAME)


@app.task(name="upsert_questionnaires", bind=True, max_retries=3, default_retry_delay=60)
def upsert_questionnaires(self, data: Dict) -> None:
    try:
        questionnaire = Questionnaire(**data)
        create_questionaries(
            data=[
                QuestionSchema(
                    **q.model_dump(),
                    category=questionnaire.category,
                )
                for q in questionnaire.questionnaires
            ],
            c=_collection_questionnaires,
        )
    except Exception as e:
        logger.error(f"Failed to upsert questionnaires: {e}")
        raise self.retry(exc=e)
