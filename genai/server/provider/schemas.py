from datetime import datetime
from typing import List
from uuid import uuid4, UUID

from .constraints import Category, Difficulty, Language
from pydantic import BaseModel, Field


class QuestionBase(BaseModel):
    question: str = Field(..., max_length=126)
    options: List[str] = Field(..., min_length=4, max_length=4)
    answer: int = Field(..., ge=0, le=3)
    category: Category = Field(Category.GENERAL_KNOWLEDGE)
    difficulty: Difficulty = Field(Difficulty.EASY)
    language: str = Field(Language.ENGLISH)


class QuestionnaireBase(BaseModel):
    q: str = Field(description="Question")
    o: List[str] = Field(description="4 options for the question")
    a: int = Field(description="Index of the correct answer")
    d: Difficulty = Field(Difficulty.EASY, description="Difficulty level of the question")
    l: Language = Field(Language.ENGLISH, description="Language of the question")


class QuestionSchema(QuestionBase):
    document_id: UUID = Field(default_factory=lambda: uuid4())
    created_at: str = Field(default_factory=datetime.now)


class GenerateQuestionSchema(BaseModel):
    prompt: str = Field(..., max_length=256)
