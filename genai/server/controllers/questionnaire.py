from .base import Controller


class QuestionnaireController(Controller):
    def __init__(self):
        super().__init__()

    async def generate(self, prompt: str):
        return await super().generate(prompt)

    async def random(self, prompt: str):
        return await super().random(prompt)
