from .tasks import *
from asyncio import to_thread
from server.core.schemas import Questionnaire


async def aupsert_questionnaires(questionnaire: Questionnaire) -> None:
    await to_thread(upsert_questionnaires.delay, questionnaire.model_dump(mode="json"))


__all__ = [
    "aupsert_questionnaires",
]
