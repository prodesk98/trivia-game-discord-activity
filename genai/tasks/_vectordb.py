import weaviate

from config import env


vecdbClient = weaviate.connect_to_local(
    host=env.WEAVIATE_HOST,
    headers={
        "X-OpenAI-Api-Key": env.OPENAI_API_KEY_EMBEDDING,
    }
)
