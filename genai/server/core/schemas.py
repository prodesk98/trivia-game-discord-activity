from typing import List, Dict

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionnaireBase, Category, QuestionBase


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase] = Field(..., description="10 Questionnaires")
    category: Category = Field(..., description="Category of the questionnaires")


class TranslationData(BaseModel):
    q: str = Field(description="Question translated")
    o: List[str] = Field(description="4 options for the question translated")


class QuestionnaireData(BaseModel):
    questionnaires: List[QuestionBase]
    category: Category


class QuestionnaireResponse(BaseModel):
    questionnaires: QuestionnaireData
    translations: Dict[str, str | dict]


class Enrichment(BaseModel):
    theme: str = Field(..., description="Theme to be enriched")
    enriched_theme: str = Field(..., description="Enriched theme enriched with key facts and subtopics")
