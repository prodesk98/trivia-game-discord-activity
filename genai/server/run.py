from fastapi import FastAPI

app = FastAPI(
    title="Questionnaire API",
    description="API for managing questionnaires",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)


@app.get("/questionnaire")
async def get_questionnaire():
    """
    Get all questionnaires
    :return:
    """
    return [
        {}
    ]


@app.post("/questionnaire")
async def post_questionnaire():
    """
    Create a new questionnaire
    :return:
    """
    return [
        {}
    ]
