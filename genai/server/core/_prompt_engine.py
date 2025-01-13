QUESTIONNAIRE_PROMPT = """Generate a quiz with {quantities} multiple-choice questions for a trivia game.

1. Questions should start easy and progressively become more challenging.
2. The quiz must strictly adhere to the chosen theme, ensuring questions are relevant and accurate without deviating from the topic.
3. Translations for questions and options are required in the following languages: {languages}.
4. Answer options must be short, clear, and concise, limited to a maximum of 5 words each.
5. Each question must have only one correct answer. Options like "all of the above" or "none of the above" are not allowed.

FORMAT INSTRUCTIONS:
{format_instructions}"""


ENRICHMENT_PROMPT = """Expand the given theme into key facts and subtopics to create diverse, accurate quiz questions. 
Ensure the information is relevant, concise, and easy to understand. 
Output must be in English and limited to 126 characters.

Format:
{format_instructions}"""


TOPIC_PROMPT = """You are an assistant specializing in creating trivia questions and answers. 
Your task is to generate specific subtopics based on a given main topic to be used in a trivia game.

**Requirements:**  
1. Generate {quantities} subtopics related to the provided main topic.
2. Subtopics should be diverse and detailed enough to allow the creation of engaging and challenging questions.
3. Use clear and concise language in English.
4. Avoid sensitive or controversial topics.

Examples:
---
Topic: Anime
Result:
- History of Anime
- Popular Genres  
- Famous Studios and Their Works  
- Memorable Characters  
- Award-Winning Anime Films

Topic: Programming
Result:
- Programming Languages
- Software Development
- Algorithms and Data Structures
- Web Development
- Mobile Development
---

Main topic: 
{topic}"""