from typing import Dict

from ._client import app
from server.provider.vecdb import create_questionaries
from server.provider.constraints import COLLECTION_NAME
from server.provider.schemas import QuestionSchema
from server.core.schemas import QuestionnaireData
from loguru import logger


@app.task(name="upsert_questionnaires", bind=True, max_retries=3, default_retry_delay=60)
def upsert_questionnaires(self, data: Dict) -> None:
    from ._vectordb import vecdbClient
    try:
        questionnaire = QuestionnaireData(**data)
        create_questionaries(
            data=[
                QuestionSchema(
                    **q.model_dump(),
                )
                for q in questionnaire.questionnaires
            ],
            c=vecdbClient.collections.get(COLLECTION_NAME),
        )
    except Exception as e:
        logger.error(f"Failed to upsert questionnaires: {e}")
        raise self.retry(exc=e)
