from abc import ABC
from typing import List, Literal

from ..core import LLM


class Controller(ABC):
    def __init__(self):
        self.llm = LLM()

    async def generate(self, prompt: str, languages: List[Literal["pt", "es", "fr"]]):
        return await self.llm.generate(prompt, languages)

    async def random(self, prompt: str, languages: List[Literal["pt", "es", "fr"]]):
        return await self.llm.random(prompt, languages)
