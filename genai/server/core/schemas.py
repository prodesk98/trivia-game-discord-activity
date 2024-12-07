from typing import List

from pydantic import BaseModel

from ..provider.schemas import QuestionnaireBase, Category, Difficulty


class Questionnaire(BaseModel):
    questionnaires: List[QuestionnaireBase]
    category: Category
