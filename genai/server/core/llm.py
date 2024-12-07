import random
from typing import Optional, List

from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate, SystemMessagePromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI

from config import env
from .schemas import Questionnaire, QuestionnaireBase

from ._prompt_engine import QUESTIONNAIRE_PROMPT

import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="langchain_openai")


class LLM:
    def __init__(self, quantities: int = 10):
        self._quantities = quantities
        self.llm = ChatOpenAI(
            model_name=env.STRUCTURED_MODEL,
            openai_api_key=env.OPENAI_API_KEY,
            streaming=False,
            seed=random.randint(0, 1000),
            temperature=random.uniform(0.0, 1.0),
            top_p=random.uniform(0.0, 1.0),
        )

    @staticmethod
    def shuffle(questionnaires: List[QuestionnaireBase]):
        _questionnaires: List[QuestionnaireBase] = []
        for q in questionnaires:
            _correct = q.options[q.answer]
            random.shuffle(q.options)
            _questionnaires.append(
                QuestionnaireBase(
                    question=q.question,
                    options=q.options,
                    answer=q.options.index(_correct),
                    difficulty=q.difficulty,
                    language=q.language,
                )
            )
        return _questionnaires

    async def generate(self, prompt: str) -> Optional[Questionnaire]:
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=QUESTIONNAIRE_PROMPT,
                input_variables=["quantities"],
            )
        )
        _prompt = ChatPromptTemplate.from_messages(
            messages=[
                _system,
                HumanMessage(content=prompt),
            ]
        )
        structured = self.llm.with_structured_output(
            Questionnaire,
            method="json_schema",
        )
        chain = (
            _prompt |
            structured
        )
        output = await chain.ainvoke({"quantities": self._quantities})
        return Questionnaire(
            questionnaires=self.shuffle(output.questionnaires),
            category=output.category,
        )