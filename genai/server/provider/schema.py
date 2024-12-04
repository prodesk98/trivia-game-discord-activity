import weaviate
import weaviate.classes as wvc
from weaviate.classes.config import Configure

from config import env


client = weaviate.connect_to_local(
    headers={
        "X-OpenAI-Api-Key": env.OPENAI_API_KEY,
    }
)

try:
    questions = client.collections.create(
        name="Question",
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
                dataType=wvc.config.DataType.UUID,
            ),
            wvc.config.Property(
                name="question",
                dataType=wvc.config.DataType.TEXT,
                vectorize_property_name=True,
                tokenization=wvc.config.Tokenization.LOWERCASE,
            ),
            wvc.config.Property(
                name="options",
                dataType=wvc.config.DataType.TEXT_ARRAY,
            ),
            wvc.config.Property(
                name="answer",
                dataType=wvc.config.DataType.NUMBER,
            ),
            wvc.config.Property(
                name="category",
                dataType=wvc.config.DataType.TEXT,
                vectorize_property_name=False,
            ),
        ]
    )
finally:
    client.close()
