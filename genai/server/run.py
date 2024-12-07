from typing import List

from fastapi import FastAPI, HTTPException, Depends, Request

from config import env
from server.core.lifespan import lifespan

from .provider import query_question, create_question
from .provider.base import Category
from .schemas.questionnaire import (
    CreateQuestionSchema,
    CreateGenerateQuestionSchema,
    CreateQuestionResponse,
    ObjectsQuestionResponse,
    QueryQuestionSchema,
)
from .controllers.questionnaire import QuestionnaireController

app = FastAPI(
    title="QuizGenAI API",
    description="API for the QuizGenAI project",
    version="1.0.0",
    docs_url="/docs" if env.DEBUG else None,
    debug=env.DEBUG,
    lifespan=lifespan,
)


@app.get("/questionnaires", response_model=List[ObjectsQuestionResponse], tags=["questionnaire"])
async def get_questionnaires(
    req: Request,
    payload: QueryQuestionSchema = Depends(QueryQuestionSchema)
) -> List[ObjectsQuestionResponse]:
    """
    Get all questionnaires
    :return:
    """
    response = await query_question(query=payload.query, c=req.app.question_collection)
    if response is None:
        raise HTTPException(status_code=500, detail="Error querying questionnaire")
    return [
        r for r in [
            ObjectsQuestionResponse(
                question=obj.properties["question"],
                options=obj.properties["options"],
                answer=obj.properties["answer"],
                category=obj.properties["category"],
                difficulty=obj.properties["difficulty"],
                distance=obj.metadata.distance,
            ) for obj in response.objects
        ]
        if r.distance <= payload.distance
    ]


@app.post("/questionnaires", response_model=CreateQuestionResponse, tags=["questionnaire"])
async def post_questionnaires(
    req: Request,
    payload: CreateQuestionSchema
) -> CreateQuestionResponse:
    """
    Create a new questionnaire
    :return:
    """
    document_id = await create_question(data=payload, c=req.app.question_collection)
    if document_id is None:
        raise HTTPException(status_code=500, detail="Error creating questionnaire")
    return CreateQuestionResponse(document_id=document_id)


@app.post("/generative", tags=["generative"])
async def generative(
    payload: CreateGenerateQuestionSchema
):
    controller = QuestionnaireController()
    response = await controller.generate(prompt=payload.prompt)
    return response.model_dump()


@app.get("/categories", tags=["categories"])
async def get_categories():
    return [c.value for c in Category]
