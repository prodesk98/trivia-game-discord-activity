import {useState} from "react";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {Player} from "../schema/Player.ts";
import {Room} from "colyseus.js";
import {useParams} from "react-router-dom";

export function useHookState() {

    const { lobbyId } = useParams();

    const [players, setPlayers] = useState<Player[]>([]);
    const [profile, setProfile] = useState<Player>();
    const [language, setLanguage] = useState<string>("en");
    const [ownerProfile, setOwnerProfile] = useState<Player>();
    const [owner, setOwner] = useState<string>();
    const [currentQuestionOptions, setCurrentQuestionOptions] = useState<QuestionOptions>();
    const [gameEnded, setGameEnded] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameLobby, setGameLobby] = useState<boolean>(true);
    const [gamePaused, setGamePaused] = useState<boolean>(false);
    const [theme, setTheme] = useState<string|null>(null);
    const [room, setRoom] = useState<Room>();
    const [categories, setCategories] = useState<string[]>([]);

    // Game logic
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerClock, setTimerClock] = useState(0);
    const [answerSelected, setAnswerSelected] = useState<number>(-1);
    const [answerCorrect, setAnswerCorrect] = useState<number>(-1);
    const [awaitingGeneration, setAwaitingGeneration] = useState(false);
    const [translations, setTranslations] = useState<Map<string, string>>(new Map());

    // Components
    const [isDialogPlayGame, setIsDialogPlayGame] = useState(false);
    const [isDialogHome, setIsDialogHome] = useState(false);
    const [isDialogRanking, setIsDialogRanking] = useState(false);

    // Auth
    const [authLobbyId, setAuthLobbyId] = useState<string | undefined>(lobbyId);

    return {
        // Getters
        answerCorrect,
        answerSelected,
        authLobbyId,
        awaitingGeneration,
        categories,
        currentQuestionOptions,
        gameEnded,
        gameLobby,
        gamePaused,
        gameStarted,
        isDialogHome,
        isDialogPlayGame,
        isDialogRanking,
        language,
        owner,
        ownerProfile,
        players,
        profile,
        room,
        theme,
        timeLeft,
        timerClock,
        translations,

        // Setters
        setAnswerCorrect,
        setAnswerSelected,
        setAuthLobbyId,
        setAwaitingGeneration,
        setCategories,
        setCurrentQuestionOptions,
        setGameEnded,
        setGameLobby,
        setGamePaused,
        setGameStarted,
        setIsDialogHome,
        setIsDialogPlayGame,
        setIsDialogRanking,
        setLanguage,
        setOwner,
        setOwnerProfile,
        setPlayers,
        setProfile,
        setRoom,
        setTheme,
        setTimeLeft,
        setTimerClock,
        setTranslations,
    };
}
