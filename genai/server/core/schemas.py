from typing import List

from pydantic import BaseModel

from ..provider.schemas import QuestionnaireBase, Category


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase]
    category: Category


class Enrichment(BaseModel):
    theme: str
    enriched_theme: str
