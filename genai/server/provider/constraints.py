from enum import Enum

COLLECTION_NAME = "Questionnaires"


class Category(Enum):
    GEOGRAPHY = "geography"
    HISTORY = "history"
    SCIENCE = "science"
    TECHNOLOGY = "technology"
    PROGRAMMING = "programming"
    ART_AND_LITERATURE = "art_and_literature"
    ENTERTAINMENT = "entertainment"
    SPORTS = "sports"
    GENERAL_KNOWLEDGE = "general_knowledge"
    MATHEMATICS = "mathematics"
    HEALTH = "health"
    NATURE = "nature"
    BUSINESS_AND_ECONOMY = "business_and_economy"
    CURRENT_EVENTS = "current_events"
    PHILOSOPHY = "philosophy"
    SCIENCE_FICTION_AND_FANTASY = "science_fiction_and_fantasy"
    POP_CULTURE = "pop_culture"
    CHILD_EDUCATION = "child_education"
    TRAVEL = "travel"
    LAW = "law"
    AUTOMOTIVE = "automotive"
    RELIGION = "religion"
    SPACE = "space"
    HUMOR = "humor"
    ARCHITECTURE = "architecture"
    FASHION_AND_STYLE = "fashion_and_style"


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"
    MASTER = "master"


class Language(Enum):
    PORTUGUESE = "portuguese"
    ENGLISH = "english"
