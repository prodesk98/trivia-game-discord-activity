import random
from typing import Optional, List

from langchain.chains.moderation import OpenAIModerationChain
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
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
            base_url=env.DEEPSEEK_API_ENDPOINT, # noqa
            openai_api_key=env.DEEPSEEK_API_KEY,
            streaming=False,
            temperature=.0,
            top_p=random.uniform(0.0, 1.0),
        )
        self.llm_moderation = ChatOpenAI(
            model_name=env.MODERATION_MODEL,
            openai_api_key=env.OPENAI_API_KEY,
        )
        self.translations: dict[str, str | dict] = {
            "pt": {},
            "es": {},
        }

    @staticmethod
    def _default_questions_base(n: int = 10, c: Category = Category.GENERAL_KNOWLEDGE) -> List[QuestionBase]:
        _questionnaires = []
        for _ in range(n):
            _questionnaires.append(
                QuestionBase(
                    question="",
                    options=["" for _ in range(4)],
                    answer=0,
                    category=c,
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
                    category=q.c,
                    language=q.l.value,
                )
            )
        random.shuffle(_questionnaires)
        return _questionnaires

    async def moderation(self, content: str) -> Optional[QuestionnaireResponse]:
        moderate = OpenAIModerationChain()
        prompt = ChatPromptTemplate.from_messages([("system", content)])
        chain = prompt | self.llm_moderation
        moderated_chain = chain | moderate

    async def enrich(self, theme: str) -> Enrichment:
        parser = JsonOutputParser(pydantic_object=Enrichment)
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=ENRICHMENT_PROMPT,
                input_variables=[],
                partial_variables={"format_instructions": parser.get_format_instructions()},
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
            method="json_mode",
        )
        chain = (
            _prompt |
            structured
        )
        output = await chain.ainvoke({})
        return output

    async def generate(self, prompt: str) -> Optional[QuestionnaireResponse]:
        _enrichment = await self.enrich(prompt)
        parser = JsonOutputParser(pydantic_object=Translations)
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=QUESTIONNAIRE_PROMPT,
                input_variables=["quantities"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
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
            method="json_mode",
        )
        chain = (_prompt | structured)

        # result
        output: Translations = await chain.ainvoke({"quantities": self._quantities})

        # set translations
        for i, q in enumerate(output.en.questionnaires):
            # Portuguese
            self.translations['pt'][q.q] = output.t.pt[i].q
            for n, o in enumerate(q.o):
                self.translations['pt'][o] = output.t.pt[i].o[n]
            # Spanish
            self.translations['es'][q.q] = output.t.es[i].q
            for n, o in enumerate(q.o):
                self.translations['es'][o] = output.t.es[i].o[n]

        # response
        return QuestionnaireResponse(
            questionnaires=QuestionnaireData(
                questionnaires=self.shuffle([q for q in output.en.questionnaires]),
                category=output.category,
            ),
            translations=self.translations,
        )


    async def random(self, prompt: str) -> Optional[QuestionnaireResponse]:
        return await self.generate(prompt)
