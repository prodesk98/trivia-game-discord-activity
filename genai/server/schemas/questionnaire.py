from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from ..provider.schemas import QuestionSchema

class CreateQuestionSchema(QuestionSchema):
    document_id: UUID = Field(default_factory=lambda: uuid4())


class QueryQuestionSchema(BaseModel):
    query: str = Field(..., max_length=126)
    distance: float = Field(0.5, ge=0.0, le=1.0)


class CreateQuestionResponse(BaseModel):
    document_id: UUID


class ObjectsQuestionResponse(QuestionSchema):
    distance: float
