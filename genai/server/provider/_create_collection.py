import weaviate.classes as wvc
from weaviate.classes.config import Configure
from loguru import logger

from ._client import client
from config import env
from .constraints import COLLECTION_NAME


async def create_collection():
    try:
        await client.connect()
        await client.collections.create(
            name=COLLECTION_NAME,
            vectorizer_config=Configure.Vectorizer.text2vec_openai(
                model=env.EMBEDDING_MODEL,
            ),
            vector_index_config=Configure.VectorIndex.hnsw(
                distance_metric=wvc.config.VectorDistances.COSINE,
                quantizer=wvc.config.Configure.VectorIndex.Quantizer.bq(),
            ),
            inverted_index_config=wvc.config.Configure.inverted_index(
                index_null_state=True,
                index_property_length=True,
                index_timestamps=True,
            ),
            properties=[
                wvc.config.Property(
                    name="document_id",
                    data_type=wvc.config.DataType.UUID, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="question",
                    data_type=wvc.config.DataType.TEXT, # noqa
                    tokenization=wvc.config.Tokenization.LOWERCASE,
                    vectorize_property_name=True,
                ),
                wvc.config.Property(
                    name="options",
                    data_type=wvc.config.DataType.TEXT_ARRAY, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="answer",
                    data_type=wvc.config.DataType.INT, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="category",
                    data_type=wvc.config.DataType.TEXT, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="difficulty",
                    data_type=wvc.config.DataType.TEXT, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="language",
                    data_type=wvc.config.DataType.TEXT, # noqa
                    skip_vectorization=True,
                ),
                wvc.config.Property(
                    name="created_at",
                    data_type=wvc.config.DataType.DATE, # noqa
                    skip_vectorization=True,
                )
            ]
        )
        if env.DEBUG:
            logger.debug(f"[{COLLECTION_NAME}] Collection created")
    except Exception as e:
        if env.DEBUG:
            logger.debug(f"[{COLLECTION_NAME}] Error creating collection: {e}")
    finally:
        await client.close()