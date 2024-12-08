from celery import Celery

from config import env

app = Celery('default', broker=env.RABBITMQ_DSN, broker_connection_retry_on_startup=True)
