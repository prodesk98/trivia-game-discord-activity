from .tasks import *
from asyncio import to_thread
from server.core.schemas import QuestionnaireData


async def aupsert_questionnaires(questionnaire: QuestionnaireData) -> None:
    await to_thread(upsert_questionnaires.delay, questionnaire.model_dump(mode="json"))


__all__ = [
    "aupsert_questionnaires",
]
