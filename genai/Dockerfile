FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml ./

RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install

COPY . .

RUN chmod +x ./entrypoint.sh
RUN ln -s /app/entrypoint.sh /usr/local/bin/genai

ENTRYPOINT ["genai"]
