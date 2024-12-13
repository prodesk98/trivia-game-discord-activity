from typing import List

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionnaireBase, Category


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase]
    category: Category


class Translations(BaseModel):
    pt: Questionnaire = Field(..., description="Portuguese translations")
    en: Questionnaire = Field(..., description="English translations")
    category: Category = Field(..., description="Category of the questionnaires")


class QuestionnaireResponse(BaseModel):
    pt: Questionnaire
    en: Questionnaire


class Enrichment(BaseModel):
    theme: str
    enriched_theme: str
