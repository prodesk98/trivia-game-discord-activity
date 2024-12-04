from fastapi import FastAPI, HTTPException, Depends, Request

from config import env
from server.core.lifespan import lifespan

from .provider import query_question, create_question
from .schemas.questionnaire import (
    CreateQuestionSchema,
    CreateQuestionResponse,
    ObjectsQuestionResponse,
    QueryQuestionSchema,
)

app = FastAPI(
    title="QuizGenAI API",
    description="API for the QuizGenAI project",
    version="1.0.0",
    docs_url="/docs" if env.DEBUG else None,
    debug=env.DEBUG,
    lifespan=lifespan,
)


@app.get("/questionnaire")
async def get_questionnaire(
    req: Request,
    payload: QueryQuestionSchema = Depends(QueryQuestionSchema)
) -> list[ObjectsQuestionResponse]:
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
                distance=obj.metadata.distance,
            ) for obj in response.objects
        ]
        if r.distance <= payload.distance
    ]


@app.post("/questionnaire")
async def post_questionnaire(
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
