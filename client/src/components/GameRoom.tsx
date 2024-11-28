import {useEffect, useRef, useState} from "react";
// assets
import correctSound from "../assets/sounds/correct-answer.ogg";
import incorrectSound from "../assets/sounds/incorrect-answer.ogg";
import backgroundMusicGameTimer from "../assets/sounds/music-game-timer.ogg";

// icons
import VolumeOff from "@mui/icons-material/VolumeOff"
import VolumeUp from "@mui/icons-material/VolumeUp"
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

// css
import "../css/GameRoom.css";

import confetti from "canvas-confetti";

import {Bounce, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Client} from "colyseus.js";

import accept from "../assets/icons/accept.png";
import incorrect from "../assets/icons/incorrect.png";
import trophy from "../assets/icons/trophy.png";

import {Player} from "../../../server/src/rooms/schema/Player";
import {QuestionOptions} from "../../../server/src/rooms/schema/QuestionOptions.ts";
import {AnswerResponse} from "../../../server/src/rooms/schema/messages/AnswerResponse.ts";
import {OrbitProgress} from "react-loading-indicators";


export default function GameRoom(){
    // Colyseus
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestionOptions, setCurrentQuestionOptions] = useState<QuestionOptions>();
    const [room, setRoom] = useState<any>(null);
    //

    const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para responder
    const [startTime, setStartTime] = useState(0); // Início do tempo
    const [isMuted, setIsMuted] = useState(false); // Mudo ou não
    const [answerSelected, setAnswerSelected] = useState<number|null>(null); // Resposta selecionada
    const [answerCorrect, setAnswerCorrect] = useState<number|null>(null); // Resposta correta
    const [showDialog, setShowDialog] = useState(false); // Exibe o diálogo de saída
    const totalTime = 30; // Tempo total da pergunta

    useEffect(() => {
        const client = new Client(import.meta.env.VITE_COLYSEUS_ENDPOINT);
        client.joinOrCreate("trivia1").then((room: any) => {
            // listener change state
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

                // set timer
                setStartTime(state.currentTimer);
                setTimeLeft(state.currentTimer);

                // set currentQuestionOptions
                setCurrentQuestionOptions(state.currentQuestionOptions);
            });

            // listener onError
            room.onError((code: any, message: any) => {
                handleNotifyError(`Error ${code}: ${message}`);
            });

            // listener onMessage
            room.onMessage("startGame", (message: any) => {
                console.log(message);
            });

            room.onMessage("gameOver", (message: any) => {
                console.log(`GameOver: ${message}`);
                console.log(players);
            });

            room.onMessage("next", (message: any) => {
                console.log(`next: ${message}`);
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

            // set room
            setRoom(room);
        });
    }, []);

    // Efeito sonoro de resposta correta
    const correctSoundEffect = useRef(() => {
        const audio = new Audio(correctSound);
        audio.volume = 0.07;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // Efeito sonoro de resposta incorreta
    const incorrectSoundEffect = useRef(() => {
        const audio = new Audio(incorrectSound);
        audio.volume = 0.2;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // background music
    // TODO: Purchase the full track: https://1.envato.market/WDQBgA
    useEffect(() => {
        const audio = new Audio(backgroundMusicGameTimer);
        audio.loop = true;
        audio.volume = isMuted ? 0 : 0.08; // Define o volume com base no estado 'isMuted'

        if (!isMuted) {
            audio.play().then(() => console.log("Background music started!"));
        } else {
            audio.pause();
        }

        audio.currentTime = 30 - timeLeft; // Define o tempo atual com base no tempo restante

        return () => {
            audio.pause();
        };
    }, [isMuted, startTime]);

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
        room.send("answer", {
            answer: i,
            rectTop: rect.top,
            rectHeight: rect.height,
        });
    }

    const handleLeaveGame = () => {
        room.leave();
    };

    const handleExitClick = () => {
        setShowDialog(true); // Exibe o diálogo
    };

    const confirmExit = () => {
        //TODO:  Adicione aqui a lógica para sair do jogo, como redirecionar para a home
        // window.location.href = "/home";
        handleLeaveGame();
    };

    const cancelExit = () => {
        setShowDialog(false); // Oculta o diálogo
    };

    const handleToggleSound = () => {
        const toggle = !isMuted;
        setIsMuted(toggle);

        if (toggle) {
            correctSoundEffect.current().pause();
        }
    };

    const progressPercentage = (timeLeft / totalTime) * 100;

    return (
        <>
            <div className="quiz-wrapper">
                <div className="quiz-container">
                    {/* Lista de jogadores no topo */}

                    <div className="players-list">
                        {
                            players && players.map((player: any) => {
                                return (
                                    <div key={player.sessionId}>
                                        <div className={`player ${player.isBestPlayer ? "best-player" : ""}`}>
                                            <div className="avatar-container">
                                                <img
                                                    src={`${player.avatar}`}
                                                    alt={player.username}
                                                    className="player-avatar"
                                                />
                                                {
                                                    player.accepted != null ? (
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
                    <div className="progress-bar">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${progressPercentage}%`,
                                background: timeLeft > 10 ? "#4caf50" : "#ff5555",
                            }}
                        ></div>
                    </div>

                    {/* Pergunta */}
                    <div className="question">
                        {
                            currentQuestionOptions && currentQuestionOptions.question != null
                            ? currentQuestionOptions.question
                            : <OrbitProgress variant="split-disc" color="#FFF" size="small" text="" textColor="" />
                        }
                    </div>

                    {/* Opções */}
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
                </div>
            </div>
            <div className="top-right-buttons">
                <button className="btn-mute" onClick={() => handleToggleSound()}>
                    {isMuted ? <VolumeOff/> : <VolumeUp/>}
                </button>
                <button className="btn-exit" onClick={() => handleExitClick()}>
                    <ExitToAppIcon/>
                </button>
            </div>
            {showDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <p>Tem certeza de que deseja sair da sala?</p>
                        <div className="dialog-actions">
                            <button className="btn-confirm" onClick={confirmExit}>
                                Sim
                            </button>
                            <button className="btn-cancel" onClick={cancelExit}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
