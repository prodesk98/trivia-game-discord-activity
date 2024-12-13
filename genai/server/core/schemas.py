from typing import List

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionnaireBase, Category, QuestionBase


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase]
    category: Category


class Translations(BaseModel):
    pt: Questionnaire = Field(..., description="Portuguese translations")
    en: Questionnaire = Field(..., description="English translations")
    category: Category = Field(..., description="Category of the questionnaires")


class QuestionnaireData(BaseModel):
    questionnaires: List[QuestionBase]
    category: Category


class QuestionnaireResponse(BaseModel):
    pt: QuestionnaireData
    en: QuestionnaireData


class Enrichment(BaseModel):
    theme: str
    enriched_theme: str
