import random
from typing import List

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import ORJSONResponse

from config import env
from server.core.lifespan import lifespan

from .provider import (
    aquery_question,
    acreate_question,
)
from .provider.constraints import Category
from .routes import metrics_routers
from .schemas.questionnaire import (
    CreateQuestionSchema,
    CreateGenerateQuestionSchema,
    CreateGenerateRandomQuestionSchema,
    CreateQuestionResponse,
    ObjectsQuestionResponse,
    QueryQuestionSchema,
)
from .controllers.questionnaire import QuestionnaireController
from tasks import aupsert_questionnaires


app = FastAPI(
    title="QuizGenAI API",
    description="API for the QuizGenAI project",
    version="1.0.0",
    docs_url="/docs" if env.DEBUG else None,
    debug=env.DEBUG,
    lifespan=lifespan,
)
app.include_router(metrics_routers)


@app.get("/questionnaires", response_model=List[ObjectsQuestionResponse], tags=["questionnaire"])
async def get_questionnaires(
    req: Request,
    payload: QueryQuestionSchema = Depends(QueryQuestionSchema)
) -> List[ObjectsQuestionResponse]:
    """
    Get all questionnaires
    :return:
    """
    response = await aquery_question(query=payload.query, c=req.app.question_collection)
    if response is None:
        raise HTTPException(status_code=500, detail="Error querying questionnaire")
    return [
        r for r in [
            ObjectsQuestionResponse(
                question=obj.properties["q"],
                options=obj.properties["o"],
                answer=obj.properties["a"],
                category=obj.properties["c"],
                difficulty=obj.properties["d"],
                language=obj.properties["l"],
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
    document_id = await acreate_question(data=payload, c=req.app.question_collection)
    if document_id is None:
        raise HTTPException(status_code=500, detail="Error creating questionnaire")
    return CreateQuestionResponse(document_id=document_id)


@app.post("/generative", tags=["generative"], response_class=ORJSONResponse)
async def generative(
    payload: CreateGenerateQuestionSchema
):
    controller = QuestionnaireController()
    response = await controller.generate(prompt=payload.prompt, languages=payload.languages)
    if response is None:
        raise HTTPException(status_code=500, detail="Error generating questionnaire")
    await aupsert_questionnaires(response.questionnaires)
    return ORJSONResponse(
        dict(
            response.questionnaires.model_dump(mode="json"),
            **dict(translations=response.translations)
        )
    )


@app.post("/random", tags=["random"], response_class=ORJSONResponse)
async def generative_random(
    payload: CreateGenerateRandomQuestionSchema
):
    controller = QuestionnaireController()
    prompt = ("\n-".join(random.choices(env.SUBTOPICS[payload.category.value], k=3))).lstrip("\n")
    response = await controller.random(prompt=prompt, languages=payload.languages)
    if response is None:
        raise HTTPException(status_code=500, detail="Error generating questionnaire")
    await aupsert_questionnaires(response.questionnaires)
    return ORJSONResponse(
        dict(
            response.questionnaires.model_dump(mode="json"),
            **dict(translations=response.translations)
        )
    )


@app.get("/categories", tags=["categories"])
async def get_categories():
    return {"categories": [c.value for c in Category]}
