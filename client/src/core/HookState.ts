import {useState} from "react";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {Player} from "../schema/Player.ts";
import {Room} from "colyseus.js";

export function useHookState() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [profile, setProfile] = useState<Player>();
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
    const [isMuted, setIsMuted] = useState(false);

    // Components
    const [isDialogPlayGame, setIsDialogPlayGame] = useState(false);
    const [isDialogRanking, setIsDialogRanking] = useState(false);

    return {
        // getters
        answerCorrect,
        answerSelected,
        currentQuestionOptions,
        gameEnded,
        gamePaused,
        gameStarted,
        gameLobby,
        isMuted,
        players,
        owner,
        profile,
        ownerProfile,
        room,
        categories,
        theme,
        timeLeft,
        timerClock,
        isDialogPlayGame,
        isDialogRanking,
        // setters
        setPlayers,
        setProfile,
        setOwnerProfile,
        setOwner,
        setCurrentQuestionOptions,
        setGameEnded,
        setGamePaused,
        setGameStarted,
        setGameLobby,
        setRoom,
        setCategories,
        setTheme,
        setTimeLeft,
        setTimerClock,
        setAnswerSelected,
        setAnswerCorrect,
        setIsMuted,
        setIsDialogPlayGame,
        setIsDialogRanking,
    };
}
