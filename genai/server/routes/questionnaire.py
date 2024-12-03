from fastapi import APIRouter

questionnaire_router = APIRouter(
    prefix="/questionnaire",
    tags=["questionnaire"],
    responses={404: {"description": "Not found"}},
)

@questionnaire_router.get("")
async def get_questionnaire():
    """
    Get all questionnaires
    :return:
    """
    return [
        {}
    ]


@questionnaire_router.post("")
async def post_questionnaire():
    """
    Create a new questionnaire
    :return:
    """
    return [
        {}
    ]