#!/bin/sh

WORKERS=4
CONCURRENCY=4

if [ "$APP_TYPE" = "api" ]; then
    echo "Starting API"
    poetry run fastapi run server/run.py --host 0.0.0.0 --port 3000 --workers $WORKERS
elif [ "$APP_TYPE" = "worker" ]; then
    echo "Starting Worker"
    poetry run celery -A tasks.tasks worker --loglevel=INFO --concurrency=$CONCURRENCY
fi

echo "No valid APP_TYPE specified"