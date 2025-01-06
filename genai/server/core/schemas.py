from typing import List, Dict

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionnaireBase, Category, QuestionBase


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase] = Field(..., description="10 Questionnaires")
    category: Category = Field(..., description="Category of the questionnaires")


class PT(BaseModel):
    q: str = Field(description="Question translated")
    o: List[str] = Field(description="4 options for the question translated")


class TranslationQuestionnaire(BaseModel):
    pt: List[PT] = Field(..., description="Portuguese translations")


class Translations(BaseModel):
    en: Questionnaire = Field(..., description="English translations")
    t: TranslationQuestionnaire = Field(..., description="Portuguese translations")
    category: Category = Field(..., description="Category of the questionnaires")


class QuestionnaireData(BaseModel):
    questionnaires: List[QuestionBase]
    category: Category


class QuestionnaireResponse(BaseModel):
    questionnaires: QuestionnaireData
    translations: Dict[str, str | dict]


class Enrichment(BaseModel):
    theme: str
    enriched_theme: str
