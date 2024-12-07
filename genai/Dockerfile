FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev

COPY . .

ENTRYPOINT ["poetry", "run", "fastapi", "run", "server/run.py", "--host", "0.0.0.0", "--port", "3000"]
