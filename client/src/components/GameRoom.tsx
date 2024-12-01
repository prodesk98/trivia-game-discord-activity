import {useEffect, useRef, useState} from "react";
// assets
import correctSound from "../assets/sounds/correct-answer.ogg";
import incorrectSound from "../assets/sounds/incorrect-answer.ogg";
import backgroundMusicGameTimer from "../assets/sounds/music-game-timer.ogg";

// icons
import VolumeOff from "@mui/icons-material/VolumeOff"
import VolumeUp from "@mui/icons-material/VolumeUp"
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// css
import "../css/GameRoom.css";

import confetti from "canvas-confetti";

import {Bounce, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import accept from "../assets/icons/accept.png";
import incorrect from "../assets/icons/incorrect.png";
import trophy from "../assets/icons/trophy.png";

// Schema
import {Player} from "../schema/Player.ts";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {AnswerResponse} from "../schema/AnswerResponse.ts";
//

import {OrbitProgress} from "react-loading-indicators";

import {setLocalStorage, getLocalStorage} from "../utils/LocalStorage.ts";
import {authenticate} from "../utils/Auth.ts";
import {colyseusSDK} from "../utils/Colyseus.ts";
import {discordSDK} from "../utils/DiscordSDK.ts";


export default function GameRoom(){

    // Colyseus
    // const [token, setToken] = useState<string|null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestionOptions, setCurrentQuestionOptions] = useState<QuestionOptions>();
    const [gameEnded, setGameEnded] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gamePaused, setGamePaused] = useState<boolean>(false);
    const [room, setRoom] = useState<any>(null);
    //

    const [timeLeft, setTimeLeft] = useState(0); // 0 segundos para responder
    const [startTime, setStartTime] = useState(0); // Início do tempo
    const [isMuted, setIsMuted] = useState(false); // Mudo ou não
    const [answerSelected, setAnswerSelected] = useState<number|null>(null); // Resposta selecionada
    const [answerCorrect, setAnswerCorrect] = useState<number|null>(null); // Resposta correta
    const [showDialogLeave, setShowDialogLeave] = useState(false); // Exibe o diálogo de saída
    const totalTime = 30; // Tempo total da pergunta

    const handleNotifyError = (e: string) => toast.error(e, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
    });

    const handleNotifyGameStatus = (e: string) => toast.info(e, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
    });

    const handleConfetti = (rectTop: number, rectHeight: number) => {
        const y = (rectTop + rectHeight / 2) / window.innerHeight;

        // Chama o efeito de confete quando o botão é clicado
        confetti({
            particleCount: 100, // Quantidade de partículas
            spread: 60, // Ângulo de dispersão
            origin: { y: y }, // Origem (ajusta a altura do disparo)
        });
    };

    const handleCalculateRanking = (players: Player[], mySessionId: string) => {
        // my player
        let me: Player | undefined = players.find((player) => player.sessionId === mySessionId);

        // remove me from players
        players = players.filter((player) => player.sessionId !== mySessionId);

        // sort players by score
        players.sort((a, b) => b.score - a.score);

        // insert my session in first position
        if (me) players = [me, ...players];

        // first player is the best player
        if (players.length > 1) {
            const bestPlayer = players[1];
            players.forEach((player) => player.isBestPlayer = player === bestPlayer && bestPlayer.score > 0);

            // set me as best player
            if (me && bestPlayer.score < me.score) {
                me.isBestPlayer = true;
                bestPlayer.isBestPlayer = false;
            }
        }else{
            players.forEach((player) => player.isBestPlayer = player.score > 0);
        }

        return players;
    }

    const handleAnswer = (e: any, i: number) => {
        if (room === null) handleNotifyError("Room not found!");
        if (timeLeft <= 0) {
            handleNotifyError(`${timeLeft} seconds left to answer!`);
            return;
        }
        if (answerSelected !== null) {
            handleNotifyError("You have already selected an answer!");
            return;
        }

        // highlight button
        const rect = e.target.getBoundingClientRect();

        // sent answer to server
        handleSendMessage("answer", {
            answer: i,
            rectTop: rect.top,
            rectHeight: rect.height,
        });

        // set answer selected
        setAnswerSelected(i);

        // set paused
        setGamePaused(true);
        setTimeLeft(30);
    }

    const handleSendMessage = (message: string, data: any = {}) => {
        room.send(message, data);
    }

    const handleLeaveGame = () => {
        room.leave();
    };

    const handleExitClick = () => {
        setShowDialogLeave(true); // Exibe o diálogo
    };

    const confirmExit = () => {
        //TODO:  Adicione aqui a lógica para sair do jogo, como redirecionar para a home
        // window.location.href = "/home";
        setShowDialogLeave(false); // Oculta o diálogo
        handleLeaveGame();
    };

    const cancelExit = () => {
        setShowDialogLeave(false); // Oculta o diálogo
    };

    const handleToggleSound = () => {
        const toggle = !isMuted;
        setIsMuted(toggle);
        setLocalStorage("isMuted", toggle);

        if (toggle) {
            correctSoundEffect.current().pause();
        }
    };

    const handleColyseusConnection = async (token: string) => {
        colyseusSDK.auth.token = token;
        const room = await colyseusSDK.joinOrCreate("game", { channelId: discordSDK.channelId });
        setRoom(room);

        room.onStateChange.once((state: any) => {
            const playersArray: Player[] = Array.from(state.players.values());

            // sort players by score
            const playersSorted = handleCalculateRanking(playersArray, room.sessionId);
            setPlayers(playersSorted);

            // onAdd player
            state.players.onAdd((player: any, sessionId: string) => {
                console.log("Player joined!", sessionId);

                player.onChange(() => {
                    // swap player
                    const index = players.findIndex((player) => player.sessionId === sessionId);
                    players[index] = player;

                    // sort players by score
                    const playersSorted = handleCalculateRanking(players, room.sessionId);

                    // apply changes
                    setPlayers(playersSorted);
                });

                // add player to list
                players.push(player);

                // sort players by score
                const playersSorted = handleCalculateRanking(players, room.sessionId);
                setPlayers(playersSorted);

                // notify player joined
                if(player.sessionId !== room.sessionId) handleNotifyGameStatus(`${player.username} joined the game!`);
            });

            // onRemove player
            state.players.onRemove((player: any, sessionId: string) => {
                console.log("Player left!", sessionId);

                // remove player from list
                const index = players.findIndex((player) => player.sessionId === sessionId);
                players.splice(index, 1);

                // sort players by score
                const playersSorted = handleCalculateRanking(players, room.sessionId);
                setPlayers(playersSorted);

                // notify player left
                handleNotifyGameStatus(`${player.username} left the game!`);
            });

            // listen currentQuestionOptions
            state.listen("currentQuestionOptions", (currentValue: QuestionOptions) => setCurrentQuestionOptions(currentValue));

            // listen currentTimer
            state.listen("currentTimer", (currentValue: number) => setTimeLeft(currentValue));

            // listen gameStarted
            state.listen("gameStarted", (currentValue: boolean) => setGameStarted(currentValue));

            // listen gameEnded
            state.listen("gameEnded", (currentValue: boolean) => setGameEnded(currentValue));

            // set timer
            setStartTime(state.currentTimer);
            setTimeLeft(state.currentTimer);

            // set currentQuestionOptions
            setCurrentQuestionOptions(state.currentQuestionOptions);
        });

        // listener onError
        room.onError((code: any, message: any) => {
            handleNotifyError(`[${code}] Error Connection: ${message}`);
        });

        // listener onMessage
        room.onMessage("startGame", (message: any) => {
            console.log(message);
            setGamePaused(false);
            setGameStarted(true);
            setGameEnded(false);
        });

        room.onMessage("gameOver", (message: any) => {
            console.log(`GameOver: ${message}`);
            setGamePaused(true);
            setGameEnded(true);
            setGameStarted(false);
            setTimeLeft(0);

            // reset answer
            setAnswerSelected(null);
            setAnswerCorrect(null);
        });

        room.onMessage("next", (message: any) => {
            console.log(`Next: ${message}`);

            // reset answer
            setAnswerSelected(null);
            setAnswerCorrect(null);

            // set paused
            setGamePaused(false);
        });

        room.onMessage("answerFeedback", (message: AnswerResponse) => {
            if (message.accepted) {
                if (!isMuted) correctSoundEffect.current().play().then(() => console.log("Correct answer!"));
                handleConfetti(message.rectTop, message.rectHeight);
            } else {
                if (!isMuted) incorrectSoundEffect.current().play().then(() => console.log("Incorrect answer!"));
            }
            setAnswerSelected(message.answered);
            setAnswerCorrect(message.correct);
        });

        room.onMessage("__playground_message_types", (message: any) => {
            console.log(message);
        });
    };

    // Discord Embedded SDK: Retrieve user token when under Discord/Embed
    useEffect(() => {
        try {
            console.log("Authenticating with Discord...");
            authenticate().then((response) => {
                const token = response.token;
                console.log("Authenticated with Discord!");
                // setToken(token);

                // connect to colyseus
                handleColyseusConnection(token).then();
            });
        }catch (e) {
            console.error(e);
            handleNotifyError(`Failed to authenticate with Discord. ${e}`);
        }
    }, []);

    // Efeito sonoro de resposta correta
    const correctSoundEffect = useRef(() => {
        const audio = new Audio(correctSound);
        audio.volume = 0.2;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // Efeito sonoro de resposta incorreta
    const incorrectSoundEffect = useRef(() => {
        const audio = new Audio(incorrectSound);
        audio.volume = 0.3;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // background music
    // TODO: Purchase the full track: https://1.envato.market/WDQBgA
    useEffect(() => {
        const isMutedStorage = getLocalStorage("isMuted");
        setIsMuted(isMutedStorage);

        const audio = new Audio(backgroundMusicGameTimer);
        audio.loop = true;
        audio.volume = isMuted ? 0 : 0.08; // Define o volume com base no estado 'isMuted'

        if (!isMuted) {
            audio.play().then(() => console.log("Background music started!"));
        } else {
            audio.pause();
        }

        if (timeLeft <= 0) {
            audio.pause();
            audio.currentTime = 0;
            return () => {
                audio.pause();
            }
        }

        audio.currentTime = 30 - timeLeft; // Define o tempo atual com base no tempo restante

        return () => {
            audio.pause();
        };
    }, [isMuted, gameStarted, startTime]);

    const progressPercentage = (timeLeft / totalTime) * 100;

    return (
        <>
            <div className="quiz-wrapper">
                <div className="quiz-container">
                    {/* Lista de jogadores no topo */}

                    <div className="players-list">
                        {
                            players && players.map((player: Player) => {
                                return (
                                    <div key={player.sessionId}>
                                        <div className={`player ${player.isBestPlayer ? "best-player" : ""}`}>
                                            <div className="avatar-container">
                                                <img
                                                    src={player.avatar}
                                                    alt={player.username}
                                                    className="player-avatar"
                                                />
                                                {
                                                    player.accepted != null && answerSelected != null ? (
                                                        player.accepted ? (
                                                            <img
                                                                src={accept}
                                                                alt="Correct"
                                                                className="icon-correct"
                                                            />
                                                        ) : (
                                                            <img
                                                                src={incorrect}
                                                                alt="Incorrect"
                                                                className="icon-incorrect"
                                                            />
                                                        )
                                                    ) : ""
                                                }
                                                {player.isBestPlayer && (
                                                    <img
                                                        src={trophy}
                                                        alt="Best Player"
                                                        className="icon-trophy"
                                                    />
                                                )}
                                            </div>
                                            <span className="player-name">{player.username}</span>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>

                    {/* Barra de progresso */}
                    {
                        currentQuestionOptions &&
                        currentQuestionOptions.question != null &&
                        !gameEnded &&
                        !gamePaused ? (
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${progressPercentage}%`,
                                        background: timeLeft > 10 ? "#4caf50" : "#ff5555",
                                    }}
                                ></div>
                            </div>
                        ) : ""
                    }

                    {/* Pergunta */}
                    <div className="question">
                        {
                            currentQuestionOptions &&
                            currentQuestionOptions.question != null &&
                            !gameEnded
                            ? currentQuestionOptions.question
                            : (
                                !gameEnded ?
                                    <OrbitProgress variant="split-disc" color="#FFF" size="small" text="" textColor="" />
                                    : ""
                            )
                        }
                    </div>


                    {/* Raking */}
                    { gameEnded ? (
                        <div className="leaderboard-container">
                            <div className="leaderboard">
                                {players.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={`leaderboard-item ${index === 0 ? "first" : index === 1 ? "second" : index === 2 ? "third" : ""}`}
                                    >
                                        <div className="rank-avatar">
                                            <span className="rank">{index + 1}</span>
                                            <img src={player.avatar} alt={player.username} className="avatar"/>
                                        </div>
                                        <span className="username">{player.username}</span>
                                        <span className="points">{player.score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) :
                    (
                        <div className="options">
                            {
                                currentQuestionOptions &&
                                currentQuestionOptions.options ?
                                currentQuestionOptions.options.map(
                                    (option, index) => (
                                        <button
                                            key={index}
                                            className={`option ${
                                                answerCorrect !== null
                                                    ? index === answerCorrect
                                                        ? "correct" // Destaca a resposta correta
                                                        : answerSelected === index ?
                                                            "incorrect" :
                                                            "default" // Destaca a resposta incorreta
                                                    : ""
                                            }`}
                                            onClick={(e) => handleAnswer(e, index)}
                                            disabled={answerSelected !== null} // Desativa os botões após a escolha
                                        >
                                            {option}
                                        </button>
                                    )
                                ) : ""
                            }
                        </div>
                    )}
                </div>
            </div>
            <div className="top-right-buttons">
                {!gameStarted && room !== null ? (
                    <button className={`btn-play-game ${isMuted ? "muted" : ""}`}
                            onClick={() => handleSendMessage("startGame", {})}>
                        <PlayArrowIcon/> Start Game
                    </button>
                ) : ""}
                <button className="btn-mute" onClick={() => handleToggleSound()}>
                    {isMuted ? <VolumeOff/> : <VolumeUp/>}
                </button>
                <button className="btn-exit" onClick={() => handleExitClick()}>
                    <ExitToAppIcon/>
                </button>
            </div>
            {showDialogLeave && (
                <div className="dialog-overlay">
                    <div className="dialog">
                    <p>Are you sure you want to leave the room?</p>
                        <div className="dialog-actions">
                            <button className="btn-confirm" onClick={confirmExit}>
                                Yes
                            </button>
                            <button className="btn-cancel" onClick={cancelExit}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
