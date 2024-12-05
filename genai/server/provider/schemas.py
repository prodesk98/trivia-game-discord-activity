from typing import List
from uuid import uuid4, UUID

from .base import Category
from pydantic import BaseModel, Field


class QuestionBase(BaseModel):
    question: str = Field(..., max_length=126)
    options: List[str] = Field(..., min_length=4, max_length=4)
    answer: int = Field(..., ge=0, le=3)
    category: Category = Field(Category.GENERAL_KNOWLEDGE)


class QuestionnaireBase(BaseModel):
    question: str
    options: List[str] = Field(description="4 options for the question")
    answer: int = Field(description="Index of the correct answer")


class QuestionSchema(QuestionBase):
    document_id: UUID = Field(default_factory=lambda: uuid4())


class GenerateQuestionSchema(BaseModel):
    prompt: str = Field(..., max_length=256)
