from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionSchema, GenerateQuestionSchema


class CreateQuestionSchema(QuestionSchema):
    document_id: UUID = Field(default_factory=lambda: uuid4())
    created_at: str = Field(default_factory=datetime.now)


class CreateGenerateQuestionSchema(GenerateQuestionSchema):
    prompt: str = Field(..., max_length=256)


class QueryQuestionSchema(BaseModel):
    query: str = Field(..., max_length=126)
    distance: float = Field(0.5, ge=0.0, le=1.0)


class CreateQuestionResponse(BaseModel):
    document_id: UUID


class ObjectsQuestionResponse(QuestionSchema):
    distance: float
