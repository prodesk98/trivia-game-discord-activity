import asyncio
import re
from os.path import dirname, join
from os import getenv
from typing import List, Dict

from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from json import dumps

from loguru import logger
from pydantic import BaseModel, Field

from server.core._prompt_engine import TOPIC_PROMPT # noqa
from server.core.schemas import Category

dotenv_path = join(dirname(__file__), 'development.env')
load_dotenv(dotenv_path=dotenv_path)

OPENAI_API_KEY = getenv("OPENAI_API_KEY2") # override
MODEL_NAME = getenv("MODEL_NAME")
QUANTITIES = getenv("QUANTITIES", 80)


class G(BaseModel):
    subtopics: List[str] = Field(
        ...,
        title="Subtopics",
        description="A list of subtopics related to a specific main topic.",
    )

llm = ChatOpenAI(
    openai_api_key=OPENAI_API_KEY,  # noqa
    model_name=MODEL_NAME,
    streaming=False,
    temperature=.0,
)

prompt = PromptTemplate(
    template=TOPIC_PROMPT,
    input_variables=["quantities", "topic"],
)


async def generate_subtopics(topic: str, quantities: int = 50) -> Dict[str, List[str]]:
    structured = llm.with_structured_output(
        G,
        method="json_schema",
    )
    chain = prompt | structured
    response: G = await chain.ainvoke({"quantities": quantities, "topic": topic})
    logger.info(f"Generated subtopics for {topic}.")
    _key = topic.replace(" ", "_").lower()
    return {_key: response.subtopics}


async def main() -> List[Dict[str, List[str]]]:
    tasks = []
    for category in list(Category):
        __value = re.sub(r"_", " ", category.value).capitalize()
        tasks.append(generate_subtopics(__value, quantities=QUANTITIES))
    return await asyncio.gather(*tasks)


if __name__ == "__main__":
    subtopics = asyncio.run(main())
    with open("subtopics.json", "w") as f:
        f.write(dumps(subtopics, indent=4))
    print("Done.")
