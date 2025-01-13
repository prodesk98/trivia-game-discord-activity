import random
from typing import Optional, List, Type, Any, Literal

from langchain.chains.moderation import OpenAIModerationChain
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate, SystemMessagePromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.chains import OpenAIModerationChain
from loguru import logger
from pydantic import create_model, Field

from config import env
from .schemas import (
    QuestionnaireBase,
    Enrichment,
    QuestionnaireResponse,
    QuestionnaireData,
    Questionnaire,
    TranslationData,
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
        self.moderate = OpenAIModerationChain(
            model_name=env.MODERATION_MODEL,
            openai_api_key=env.OPENAI_API_KEY,
        )
        self.translations: dict[str, str | dict] = {
            "pt": {},
            "es": {},
            "fr": {},
            "de": {},
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

    @staticmethod
    def title_from_language(language: str) -> str:
        return {
            "pt": "Portuguese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
        }.get(language, "")

    @staticmethod
    async def moderation(content: str) -> str:
        moderate = OpenAIModerationChain()
        output = (await moderate.ainvoke({"input": content}))['output']
        return output

    def _create_dynamic_translation_model(self, languages: List[str]) ->  dict[str, tuple[Type[list[TranslationData]], Any]]:
        _fields = {}
        for l in languages:
            _fields[l] = (
                List[TranslationData],
                Field(..., description=f"{self.title_from_language(l)} translations", title=self.title_from_language(l)))
        return _fields

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

    async def generate(self, prompt: str, languages: List[Literal["pt", "es", "fr", "de"]]) -> Optional[QuestionnaireResponse]:
        if "violates" in (await self.moderation(prompt)):
            logger.error("Prompt violates moderation policy")
            return

        _enrichment = await self.enrich(prompt)

        TranslationQuestionnaireModel = create_model(
            "TranslationQuestionnaireModel",
            **self._create_dynamic_translation_model([l for l in languages]),
        )

        QuestionnaireModel = create_model(
            "QuestionnaireModel",
            questionnaire=(
            Questionnaire, Field(..., title="Questionnaire", description="A list of questionnaire items.")),
            translations=(TranslationQuestionnaireModel,
                          Field(..., title="Translations", description="Translations for the questionnaire.")),
        )

        parser = JsonOutputParser(pydantic_object=QuestionnaireModel)
        _system = SystemMessagePromptTemplate(
            prompt=PromptTemplate(
                template=QUESTIONNAIRE_PROMPT,
                input_variables=["quantities", "languages"],
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
            QuestionnaireModel,
            method="json_mode",
        )
        chain = (_prompt | structured)

        # result
        output: QuestionnaireModel = await chain.ainvoke(
            {
                "quantities": self._quantities,
                "languages": ", ".join([self.title_from_language(l) for l in languages]) if len(languages) > 1 else "English Only.",
            }
        )

        # set translations
        for i, q in enumerate(output.questionnaire.questionnaires):
            if "pt" in languages:
                try:
                    # Portuguese
                    self.translations['pt'][q.q] = output.translations.pt[i].q
                    for n, o in enumerate(q.o):
                        self.translations['pt'][o] = output.translations.pt[i].o[n]
                except (IndexError, KeyError, AttributeError):
                    logger.error(f"IndexError in translations for Portuguese {q.q}")
                    pass
            if "es" in languages:
                try:
                    # Spanish
                    self.translations['es'][q.q] = output.translations.es[i].q
                    for n, o in enumerate(q.o):
                        self.translations['es'][o] = output.translations.es[i].o[n]
                except (IndexError, KeyError, AttributeError):
                    logger.error(f"IndexError in translations for Spanish {q.q}")
                    pass
            if "fr" in languages:
                try:
                    # French
                    self.translations['fr'][q.q] = output.translations.fr[i].q
                    for n, o in enumerate(q.o):
                        self.translations['fr'][o] = output.translations.fr[i].o[n]
                except (IndexError, KeyError, AttributeError):
                    logger.error(f"IndexError in translations for French {q.q}")
                    pass
            if "de" in languages:
                try:
                    # German
                    self.translations['de'][q.q] = output.translations.de[i].q
                    for n, o in enumerate(q.o):
                        self.translations['de'][o] = output.translations.de[i].o[n]
                except (IndexError, KeyError, AttributeError):
                    logger.error(f"IndexError in translations for German {q.q}")
                    pass

        # response
        return QuestionnaireResponse(
            questionnaires=QuestionnaireData(
                questionnaires=self.shuffle([q for q in output.questionnaire.questionnaires]),
                category=output.questionnaire.category,
            ),
            translations=self.translations,
        )


    async def random(self, prompt: str, languages: List[Literal["pt", "es", "fr", "de"]]) -> Optional[QuestionnaireResponse]:
        return await self.generate(prompt, languages)
