import {useState} from "react";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {Player} from "../schema/Player.ts";
import {Room} from "colyseus.js";

export function useHookState() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestionOptions, setCurrentQuestionOptions] = useState<QuestionOptions>();
    const [gameEnded, setGameEnded] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gamePaused, setGamePaused] = useState<boolean>(false);
    const [room, setRoom] = useState<Room>();

    // Game logic
    const [timeLeft, setTimeLeft] = useState(0);
    const [answerSelected, setAnswerSelected] = useState<number>(-1);
    const [answerCorrect, setAnswerCorrect] = useState<number>(-1);
    const [isMuted, setIsMuted] = useState(false);

    return {
        // getters
        answerCorrect,
        answerSelected,
        currentQuestionOptions,
        gameEnded,
        gamePaused,
        gameStarted,
        isMuted,
        players,
        room,
        timeLeft,
        // setters
        setPlayers,
        setCurrentQuestionOptions,
        setGameEnded,
        setGamePaused,
        setGameStarted,
        setRoom,
        setTimeLeft,
        setAnswerSelected,
        setAnswerCorrect,
        setIsMuted,
    };
}
