from fastapi import FastAPI

from routes import questionnaire_router

app = FastAPI()

app.include_router(questionnaire_router)
