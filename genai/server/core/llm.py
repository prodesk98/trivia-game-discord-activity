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
    QuestionnaireResponse,
    QuestionnaireData,
)

from ._prompt_engine import QUESTIONNAIRE_PROMPT, ENRICHMENT_PROMPT

import warnings

from ..provider.constraints import Category, Difficulty, Language
from ..provider.schemas import QuestionnaireIndex, QuestionBase

warnings.filterwarnings("ignore", category=UserWarning, module="langchain_openai")


class LLM:
    def __init__(self, quantities: int = 10):
        self._quantities = quantities
        self.llm = ChatOpenAI(
            model_name=env.STRUCTURED_MODEL,
            openai_api_key=env.OPENAI_API_KEY,
            streaming=False,
            temperature=random.uniform(0.0, .1),
            top_p=random.uniform(0.0, 1.0),
        )
        self.translations: dict[str, str | dict] = {
            "pt": {},
        }

    @staticmethod
    def _default_questions_base(n: int = 10) -> List[QuestionBase]:
        _questionnaires = []
        for _ in range(n):
            _questionnaires.append(
                QuestionBase(
                    question="",
                    options=["" for _ in range(4)],
                    answer=0,
                    category=Category.GENERAL_KNOWLEDGE,
                    difficulty=Difficulty.EASY,
                    language=Language.ENGLISH.value
                )
            )
        return _questionnaires

    @staticmethod
    def shuffle(questionnaires: List[QuestionnaireBase]) -> List[QuestionnaireIndex]:
        _questionnaires: List[QuestionnaireIndex] = []
        for n, q in enumerate(questionnaires):
            _correct = q.o[q.a]
            random.shuffle(q.o)
            _questionnaires.append(
                QuestionnaireIndex(
                    index=n,
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
        chain = (_prompt | structured)

        # result
        output: Translations = await chain.ainvoke({"quantities": self._quantities})

        # set translations
        for i, q in enumerate(output.en.questionnaires):
            self.translations['pt'][q.q] = output.pt.questionnaires[i].q
            for n, o in enumerate(q.o):
                self.translations['pt'][o] = output.pt.questionnaires[i].o[n]

        # shuffle questionnaires
        en_questionnaires = self.shuffle([q for q in output.en.questionnaires])

        # pt questionnaires
        pt_questionnaires = self._default_questions_base(self._quantities)

        # fill pt questionnaires
        for n, q in enumerate(en_questionnaires):
            options = output.pt.questionnaires[q.index].o
            answer_index = output.pt.questionnaires[q.index].o[output.pt.questionnaires[q.index].a]
            random.shuffle(options)
            pt_questionnaires[n].id = q.id
            pt_questionnaires[n].question = output.pt.questionnaires[q.index].q
            pt_questionnaires[n].options = options
            pt_questionnaires[n].answer = options.index(answer_index)
            pt_questionnaires[n].difficulty = output.pt.questionnaires[q.index].d
            pt_questionnaires[n].language = output.pt.questionnaires[q.index].l.value

        # response
        return QuestionnaireResponse(
            questionnaires=QuestionnaireData(
                questionnaires=en_questionnaires,
                category=output.category,
            ),
            translations=self.translations,
        )


    async def random(self, prompt: str) -> Optional[QuestionnaireResponse]:
        return await self.generate(prompt)
