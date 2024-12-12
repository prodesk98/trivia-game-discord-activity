import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';


const resources = {
    en: {
        translation: {
            "Customize your Quiz with a Theme": "Customize your Quiz with a Theme",
            "Artificial intelligence creates personalized questions based on the chosen topic.": "Artificial intelligence creates personalized questions based on the chosen topic.",
            "Enter a theme, e.g. Greek Mythology...": "Enter a theme, e.g. Greek Mythology...",
            "Choose Theme": "Choose Theme",
            "Random Theme": "Random Theme",
            "Or": "Or",
            "Choose a theme to start the game!": "Choose a theme to start the game!",
            "seconds": "seconds",
            "Leaderboard": "Leaderboard",
            "Connecting...": "Connecting...",
            "Waiting for {{username}} to choose the theme...": "Waiting for {{username}} to choose the theme...",
            "Category": "Category",
            "You": "You",
            "geography": "Geography",
            "history": "History",
            "science": "Science",
            "technology": "Technology",
            "programming": "Programming",
            "art_and_literature": "Art and Literature",
            "entertainment": "Entertainment",
            "sports": "Sports",
            "general_knowledge": "General Knowledge",
            "mathematics": "Mathematics",
            "health": "Health",
            "nature": "Nature",
            "business_and_economy": "Business and Economy",
            "current_events": "Current Events",
            "philosophy": "Philosophy",
            "science_fiction_and_fantasy": "Science Fiction and Fantasy",
            "pop_culture": "Pop Culture",
            "child_education": "Child Education",
            "travel": "Travel",
            "law": "Law",
            "automotive": "Automotive",
            "religion": "Religion",
            "space": "Space",
            "humor": "Humor",
            "architecture": "Architecture",
            "fashion_and_style": "Fashion and Style"
        }
    },
    pt: {
        translation: {
            "Customize your Quiz with a Theme": "Personalize seu Quiz com um Tema",
            "Artificial intelligence creates personalized questions based on the chosen topic.": "A inteligência artificial cria perguntas personalizadas com base no tópico escolhido.",
            "Enter a theme, e.g. Greek Mythology...": "Digite um tema, por exemplo, Mitologia Grega...",
            "Choose Theme": "Escolher Tema",
            "Random Theme": "Tema Aleatório",
            "Or": "Ou",
            "Choose a theme to start the game!": "Escolha um tema para começar o jogo!",
            "seconds": "segundos",
            "Choose theme": "Escolha um tema",
            "Leaderboard": "Classificação",
            "Connecting...": "Conectando...",
            "Waiting for {{username}} to choose the theme...": "Aguardando {{username}} escolher o tema...",
            "Category": "Categoria",
            "You": "Você",
            "geography": "Geografia",
            "history": "História",
            "science": "Ciência",
            "technology": "Tecnologia",
            "programming": "Programação",
            "art_and_literature": "Arte e Literatura",
            "entertainment": "Entretenimento",
            "sports": "Esportes",
            "general_knowledge": "Conhecimentos Gerais",
            "mathematics": "Matemática",
            "health": "Saúde",
            "nature": "Natureza",
            "business_and_economy": "Negócios e Economia",
            "current_events": "Eventos Atuais",
            "philosophy": "Filosofia",
            "science_fiction_and_fantasy": "Ficção Científica e Fantasia",
            "pop_culture": "Cultura Pop",
            "child_education": "Educação Infantil",
            "travel": "Viagem",
            "law": "Direito",
            "automotive": "Automotivo",
            "religion": "Religião",
            "space": "Espaço",
            "humor": "Humor",
            "architecture": "Arquitetura",
            "fashion_and_style": "Moda e Estilo"
        }
    },
    es: {
        translation: {
            "Customize your Quiz with a Theme": "Personaliza tu Cuestionario con un Tema",
            "Artificial intelligence creates personalized questions based on the chosen topic.": "La inteligencia artificial crea preguntas personalizadas basadas en el tema elegido.",
            "Enter a theme, e.g. Greek Mythology...": "Ingresa un tema, ej. Mitología Griega...",
            "Choose Theme": "Elegir Tema",
            "Random Theme": "Tema Aleatorio",
            "Or": "O",
            "Choose a theme to start the game!": "¡Elige un tema para comenzar el juego!",
            "seconds": "segundos",
            "Choose theme": "Elegir tema",
            "Leaderboard": "Tabla de Clasificación",
            "Connecting...": "Conectando...",
            "Waiting for {{username}} to choose the theme...": "Esperando a que {{username}} elija el tema...",
            "Category": "Categoría",
            "You": "Tú",
            "geography": "Geografía",
            "history": "Historia",
            "science": "Ciencia",
            "technology": "Tecnología",
            "programming": "Programación",
            "art_and_literature": "Arte y Literatura",
            "entertainment": "Entretenimiento",
            "sports": "Deportes",
            "general_knowledge": "Conocimiento General",
            "mathematics": "Matemáticas",
            "health": "Salud",
            "nature": "Naturaleza",
            "business_and_economy": "Negocios y Economía",
            "current_events": "Eventos Actuales",
            "philosophy": "Filosofía",
            "science_fiction_and_fantasy": "Ciencia Ficción y Fantasía",
            "pop_culture": "Cultura Pop",
            "child_education": "Educación Infantil",
            "travel": "Viajes",
            "law": "Derecho",
            "automotive": "Automotriz",
            "religion": "Religión",
            "space": "Espacio",
            "humor": "Humor",
            "architecture": "Arquitectura",
            "fashion_and_style": "Moda y Estilo"
        }
    }
};


i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        debug: true,
        interpolation: {
            escapeValue: false,
        },
    }).then(r => console.log(r));


export default i18n;