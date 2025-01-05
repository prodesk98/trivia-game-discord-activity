import random
from typing import Optional, List

from langchain_core.messages import HumanMessage
from langchain_core.prompts import PromptTemplate, SystemMessagePromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI

from config import env
from .schemas import (
    QuestionnaireBase,
    Enrichment,
    Translations,
    QuestionnaireResponse, QuestionnaireData
)

from ._prompt_engine import QUESTIONNAIRE_PROMPT, ENRICHMENT_PROMPT

import warnings

from ..provider.schemas import QuestionBase

warnings.filterwarnings("ignore", category=UserWarning, module="langchain_openai")


class LLM:
    def __init__(self, quantities: int = 10):
        self._quantities = quantities
        self.llm = ChatOpenAI(
            model_name=env.STRUCTURED_MODEL,
            openai_api_key=env.OPENAI_API_KEY,
            streaming=False,
            temperature=random.uniform(0.0, .3),
            top_p=random.uniform(0.0, 1.0),
        )

    @staticmethod
    def shuffle(questionnaires: List[QuestionnaireBase]) -> List[QuestionBase]:
        _questionnaires: List[QuestionBase] = []
        for q in questionnaires:
            _correct = q.o[q.a]
            random.shuffle(q.o)
            _questionnaires.append(
                QuestionBase(
                    question=q.q,
                    options=q.o,
                    answer=q.o.index(_correct),
                    difficulty=q.d,
                    language=q.l.value,
                )
            )
        random.shuffle(_questionnaires)
        return _questionnaires

    async def enrich(self, theme: str) -> Enrichment:
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=ENRICHMENT_PROMPT,
                input_variables=[],
            )
        )
        _prompt = ChatPromptTemplate.from_messages(
            messages=[
                _system,
                HumanMessage(content=theme),
            ]
        )
        structured = self.llm.with_structured_output(
            Enrichment,
            method="json_schema",
        )
        chain = (
            _prompt |
            structured
        )
        output = await chain.ainvoke({})
        return output

    async def generate(self, prompt: str) -> Optional[QuestionnaireResponse]:
        _enrichment = await self.enrich(prompt)
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=QUESTIONNAIRE_PROMPT,
                input_variables=["quantities"],
            )
        )
        _prompt = ChatPromptTemplate.from_messages(
            messages=[
                _system,
                HumanMessage(content=_enrichment.enriched_theme),
            ]
        )
        structured = self.llm.with_structured_output(
            Translations,
            method="json_schema",
        )
        chain = (
            _prompt |
            structured
        )
        output: Translations = await chain.ainvoke({"quantities": self._quantities})
        return QuestionnaireResponse(
            pt=QuestionnaireData(
                questionnaires=self.shuffle([q for q in output.pt.questionnaires]),
                category=output.category,
            ),
            en=QuestionnaireData(
                questionnaires=self.shuffle([q for q in output.en.questionnaires]),
                category=output.category,
            ),
        )


    async def random(self, prompt: str) -> Optional[QuestionnaireResponse]:
        return await self.generate(prompt)
