from prometheus_client import Gauge, CONTENT_TYPE_LATEST, generate_latest
from fastapi import APIRouter, Response, Request

from server.controllers.metrcis import get_count_users, get_count_online_users, get_count_rooms, get_scores, get_guilds, \
    get_count_questions

count_users_metric = Gauge('count_users', 'Total number of users')
count_online_users_metric = Gauge('count_online_users', 'Total number of online users')
count_rooms_metric = Gauge('count_rooms', 'Total number of rooms')
count_scores_metric = Gauge('count_scores', 'Total number of scores')
count_guilds_metric = Gauge('count_guilds', 'Total number of guilds')
count_questions_metric = Gauge('count_questions', 'Total number of questions')


metrics_routers = APIRouter(
    prefix='/metrics',
)
@metrics_routers.get("/")
async def metrics(req: Request):
    count_users_metric.set(await get_count_users())
    count_online_users_metric.set(await get_count_online_users())
    count_rooms_metric.set(await get_count_rooms())
    count_scores_metric.set(await get_scores())
    count_guilds_metric.set(await get_guilds())
    count_questions_metric.set(await get_count_questions(req.app.question_collection))

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
