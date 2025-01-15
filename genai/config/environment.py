from typing import Optional, Dict, List

from pydantic import BaseModel, AmqpDsn, Field
from dotenv import load_dotenv
from os import getenv

from .themes import THEMES
from .subtopics import SUBTOPICS

load_dotenv()


class Environment(BaseModel):
    DEBUG: bool = getenv("DEBUG", False)
    WEAVIATE_HOST: Optional[str] = getenv("WEAVIATE_HOST", "localhost")
    SECRET_KEY: Optional[str] = getenv("SECRET_KEY")
    DEEPSEEK_API_ENDPOINT: str = getenv("DEEPSEEK_API_ENDPOINT", "https://api.deepseek.com")
    OPENAI_API_KEY: Optional[str] = getenv("OPENAI_API_KEY")
    DEEPSEEK_API_KEY: Optional[str] = getenv("DEEPSEEK_API_KEY")
    EMBEDDING_MODEL: Optional[str] = getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    OPENAI_MODEL: Optional[str] = getenv("OPENAI_MODEL", "gpt-4o-mini")
    DEEPSEEK_MODEL: Optional[str] = getenv("DEEPSEEK_MODEL", "deepseek-chat")
    OPENAI_MODERATION_MODEL: Optional[str] = getenv("OPENAI_MODERATION_MODEL", "text-moderation-stable")
    RABBITMQ_DSN: Optional[AmqpDsn] = getenv("RABBITMQ_DSN", "amqp://guest:guest@localhost:5672//")
    THEMES: List[str] = Field(default_factory=lambda: THEMES) # noqa
    SUBTOPICS: Dict[str, List[str]] = Field(default_factory=lambda: SUBTOPICS) # noqa

env = Environment()