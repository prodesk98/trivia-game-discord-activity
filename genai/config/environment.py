from typing import Optional

from pydantic import BaseModel
from dotenv import load_dotenv
from os import getenv

load_dotenv()


class Environment(BaseModel):
    DEBUG: bool = getenv("DEBUG", False)
    WEAVIATE_HOST: Optional[str] = getenv("WEAVIATE_HOST", "localhost")
    SECRET_KEY: Optional[str] = getenv("SECRET_KEY")
    OPENAI_API_KEY: Optional[str] = getenv("OPENAI_API_KEY")
    EMBEDDING_MODEL: Optional[str] = getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    STRUCTURED_MODEL: Optional[str] = getenv("STRUCTURED_MODEL", "gpt-4o-mini")

env = Environment()