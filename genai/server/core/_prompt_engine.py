QUESTIONNAIRE_PROMPT = """Generate a quiz with {quantities} multiple-choice questions for a trivia game.

1. Questions should start easy and progressively become more challenging.
2. The quiz must strictly adhere to the chosen theme, ensuring questions are relevant and accurate without deviating from the topic.
3. The quiz must be entirely in Portuguese and English.
4. Answer options must be short, clear, and concise, limited to a maximum of 5 words each.
5. Each question must have only one correct answer. Options like "all of the above" or "none of the above" are not allowed."""


ENRICHMENT_PROMPT = """Expand the given theme with key facts and subtopics to create diverse and accurate quiz questions. 
Ensure all information is relevant, easy to understand.
Max length: 126 characters."""