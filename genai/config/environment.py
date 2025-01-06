from typing import Optional

from pydantic import BaseModel, AmqpDsn
from dotenv import load_dotenv
from os import getenv

from .themes import THEMES

load_dotenv()


class Environment(BaseModel):
    DEBUG: bool = getenv("DEBUG", False)
    WEAVIATE_HOST: Optional[str] = getenv("WEAVIATE_HOST", "localhost")
    SECRET_KEY: Optional[str] = getenv("SECRET_KEY")
    OPENAI_API_ENDPOINT: str = getenv("OPENAI_API_ENDPOINT", "https://api.openai.com/v1")
    OPENAI_API_KEY: Optional[str] = getenv("OPENAI_API_KEY")
    OPENAI_API_KEY_EMBEDDING: Optional[str] = getenv("OPENAI_API_KEY_EMBEDDING", OPENAI_API_KEY)
    EMBEDDING_MODEL: Optional[str] = getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    STRUCTURED_MODEL: Optional[str] = getenv("STRUCTURED_MODEL", "gpt-4o-mini")
    RABBITMQ_DSN: Optional[AmqpDsn] = getenv("RABBITMQ_DSN", "amqp://guest:guest@localhost:5672//")
    THEMES: Optional[str] = getenv("THEMES", THEMES)

env = Environment()