from abc import ABC
from ..core import LLM


class Controller(ABC):
    def __init__(self):
        self.llm = LLM()

    async def generate(self, prompt: str):
        return await self.llm.generate(prompt)

    async def random(self, prompt: str):
        return await self.llm.random(prompt)
