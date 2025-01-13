from typing import List, Literal

from .base import Controller


class QuestionnaireController(Controller):
    def __init__(self):
        super().__init__()

    async def generate(self, prompt: str, languages: List[Literal["pt", "es", "fr"]]):
        return await super().generate(prompt, languages)

    async def random(self, prompt: str, languages: List[Literal["pt", "es", "fr"]]):
        return await super().random(prompt, languages)
