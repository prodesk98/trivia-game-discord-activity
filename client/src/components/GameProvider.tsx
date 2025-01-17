import {createContext, useContext, useEffect, useRef, useState} from "react";
import {useHookState} from "../core/HookState.ts";
import {Room} from "colyseus.js";
import {Player} from "../schema/Player.ts";
import {QuestionOptions} from "../schema/QuestionOptions.ts";

interface GameContextType {
    isMuted: boolean;
    setIsMuted: (m: boolean) => void;
    playAudio: () => void;
    pauseAudio: () => void;
    toggleAudio: () => void;
    isAudioPlaying: boolean;
    language: string;
    setLanguage: (language: string) => void;
    room: Room | undefined;
    setRoom: (room: Room) => void;
    ownerProfile: Player|undefined;
    setOwnerProfile: (p: Player|undefined) => void;
    profile: Player|undefined;
    setProfile: (p: Player) => void;
    theme: string | null;
    setTheme: (t: string | null) => void;
    players: Player[];
    setPlayers: (p: Player[]) => void;
    currentQuestionOptions: QuestionOptions|undefined;
    setCurrentQuestionOptions: (q: QuestionOptions) => void;
    timeLeft: number;
    setTimeLeft: (t: number) => void;
    timerClock: number;
    setTimerClock: (t: number) => void;
    gameStarted: boolean;
    setGameStarted: (g: boolean) => void;
    gameLobby: boolean;
    setGameLobby: (g: boolean) => void;
    gameEnded: boolean;
    setGameEnded: (g: boolean) => void;
    gamePaused: boolean;
    setGamePaused: (g: boolean) => void;
    answerSelected: number;
    setAnswerSelected: (a: number) => void;
    answerCorrect: number;
    setAnswerCorrect: (a: number) => void;
    awaitingGeneration: boolean;
    setAwaitingGeneration: (a: boolean) => void;
    translations: Map<string, string>;
    setTranslations: (t: Map<string, string>) => void;
    categories: string[];
    setCategories: (c: string[]) => void;
    owner: string|undefined;
    setOwner: (o: string) => void;
    tokenDiscord: string | undefined;
    setTokenDiscord: (t: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: any): JSX.Element => {
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [tokenDiscord, setTokenDiscord] = useState<string | undefined>();

    const {
        language, setLanguage, room, setRoom, ownerProfile, setOwnerProfile,
        profile, setProfile, theme, setTheme, setPlayers, players,
        currentQuestionOptions, setCurrentQuestionOptions,
        timeLeft, setTimeLeft, timerClock, setTimerClock,
        gameStarted, setGameStarted, gameLobby, setGameLobby,
        gameEnded, setGameEnded, gamePaused, setGamePaused,
        answerSelected, setAnswerSelected, answerCorrect, setAnswerCorrect,
        awaitingGeneration, setAwaitingGeneration, translations, setTranslations,
        categories, setCategories, owner, setOwner,
    } = useHookState();

    const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = () => {
        if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
            backgroundMusicRef.current.play().then(() => console.log("Audio started!"));
            setIsAudioPlaying(true);
        }
    };

    const pauseAudio = () => {
        if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
            backgroundMusicRef.current.pause();
            setIsAudioPlaying(false);
        }
    };

    const toggleAudio = () => {
        setIsMuted(!isMuted);
    };

    useEffect(() => {
        if (!backgroundMusicRef.current) {
            if (import.meta.env.VITE_NODE_ENV !== "development") {
                backgroundMusicRef.current = new Audio('.proxy/streaming/lofi');
            } else {
                backgroundMusicRef.current = new Audio(import.meta.env.VITE_LIVESTREAM_ENDPOINT);
            }
            backgroundMusicRef.current.loop = true;
            backgroundMusicRef.current.volume = 0.2;
        }

        if (isMuted) {
            backgroundMusicRef.current.muted = true;
            backgroundMusicRef.current.pause();
        } else {
            backgroundMusicRef.current.muted = false;
            backgroundMusicRef.current.play().then(() => console.log("Audio started!"));
        }

        return () => {
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.pause();
            }
        };
    }, [isMuted]);

    useEffect(() => {
        const isMutedStorage = localStorage.getItem("isMuted");
        if (isMutedStorage) {
            setIsMuted(JSON.parse(isMutedStorage));
        }
    }, []);

    return <GameContext.Provider value={{
        isMuted,
        setIsMuted,
        playAudio,
        pauseAudio,
        toggleAudio,
        isAudioPlaying,
        language,
        setLanguage,
        room,
        setRoom,
        ownerProfile,
        setOwnerProfile,
        profile,
        setProfile,
        theme,
        setTheme,
        players,
        setPlayers,
        currentQuestionOptions,
        setCurrentQuestionOptions,
        timeLeft,
        setTimeLeft,
        timerClock,
        setTimerClock,
        gameStarted,
        setGameStarted,
        gameLobby,
        setGameLobby,
        gameEnded,
        setGameEnded,
        gamePaused,
        setGamePaused,
        answerSelected,
        setAnswerSelected,
        answerCorrect,
        setAnswerCorrect,
        awaitingGeneration,
        setAwaitingGeneration,
        translations,
        setTranslations,
        categories,
        setCategories,
        owner,
        setOwner,
        tokenDiscord,
        setTokenDiscord,
    }}>{children}</GameContext.Provider>;
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
};