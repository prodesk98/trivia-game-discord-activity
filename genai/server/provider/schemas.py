from uuid import uuid4, UUID

from .base import Category
from pydantic import BaseModel, Field


class QuestionSchema(BaseModel):
    document_id: UUID = Field(default_factory=lambda: uuid4())
    question: str = Field(..., max_length=126)
    options: list[str] = Field(..., min_length=4, max_length=4)
    answer: int = Field(..., ge=0, le=3)
    category: Category = Field(Category.GENERAL_KNOWLEDGE)
