

QUESTIONNAIRE_PROMPT = """Generate a quiz with {quantities} multiple-choice questions for a trivia game.

1. Questions should start easy and progressively become more challenging.
2. The quiz must strictly adhere to the chosen theme, ensuring questions are relevant and accurate without deviating from the topic.
3. The quiz must be entirely in Portuguese and English."""


ENRICHMENT_PROMPT = """Expand the given theme with key facts and subtopics to create diverse and accurate quiz questions. Ensure all information is relevant, easy to understand, and in Portuguese.
Max length: 126 characters.

Theme:
\"\"\"{theme}\"\"\"
"""