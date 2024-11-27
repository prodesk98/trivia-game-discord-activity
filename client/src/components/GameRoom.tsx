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


export default function GameRoom(){
    // Colyseus
    const [players, setPlayers] = useState<Player[]>([]);
    const [question, setQuestion] = useState<QuestionOptions>();
    const [room, setRoom] = useState<any>(null);
    //

    const [gameStateLoaded, setGameStateLoaded] = useState(false); // Estado do jogo carregado
    const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para responder
    const [isPaused, setIsPaused] = useState(false); // Pausado ou não
    const [isMuted, setIsMuted] = useState(false); // Mudo ou não
    const [answerSelected, setAnswerSelected] = useState(null); // Resposta selecionada
    const [showDialog, setShowDialog] = useState(false); // Exibe o diálogo de saída
    const totalTime = 30; // Tempo total da pergunta
    const correctAnswerIndex = 2; // Resposta correta
    const options = ["C++", "C#", "Python", "Javascript"]; // Opções de resposta

    useEffect(() => {
        const client = new Client(import.meta.env.VITE_COLYSEUS_ENDPOINT);
        client.joinOrCreate("trivia1").then((room: any) => {
            setRoom(room);

            // listener change state
            room.onStateChange.once((state: any) => {
                setPlayers(Array.from(state.players.values()));

                // onAdd player
                state.players.onAdd((player: any, sessionId: string) => {
                    console.log("Player joined!", sessionId);

                    // add player to list
                    players.push(player);
                    setPlayers([...players]);

                    // notify player joined
                    if(gameStateLoaded) handleNotifyGameStatus(`${player.username} joined the game!`);
                });

                // onRemove player
                state.players.onRemove((player: any, sessionId: string) => {
                    console.log("Player left!", sessionId);

                    // remove player from list
                    const index = players.findIndex((player) => player.sessionId === sessionId);
                    players.splice(index, 1);
                    setPlayers([...players]);

                    // notify player left
                    handleNotifyGameStatus(`${player.username} left the game!`);
                });

                // currentTimerChange
                state.onChange = (changes: any) => {
                    changes.forEach((change: any) => {
                        if(change.field === "currentTimer"){
                            setTimeLeft(change.value);
                        }
                        console.log(change);
                    });
                }

                // set timer
                setTimeLeft(state.currentTimer);
                console.log(state.currentTimer);
                setGameStateLoaded(true);
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
                console.log(message);
            });

            room.onMessage("next", (message: any) => {
                console.log(message);
            });

            room.onMessage("__playground_message_types", (message: any) => {
                console.log(message);
            });
        });
    }, []);

    // Efeito sonoro de resposta correta
    const correctSoundEffect = useRef(() => {
        const audio = new Audio(correctSound);
        audio.volume = 0.8;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // Efeito sonoro de resposta incorreta
    const incorrectSoundEffect = useRef(() => {
        const audio = new Audio(incorrectSound);
        audio.volume = 0.8;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // background music
    // TODO: Purchase the full track: https://1.envato.market/WDQBgA
    useEffect(() => {
        const audio = new Audio(backgroundMusicGameTimer);
        if (isPaused) {
            audio.pause();
            return;
        }
        audio.loop = false;
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
    }, [isMuted, isPaused]);

    useEffect(() => {
        // console.log(players);
    }, [players]);

    // Seleciona a resposta
    const handleSelectAnswer = (i: number) => {
        // @ts-ignore
        setAnswerSelected(i);
        setIsPaused(true);
    };
    useEffect(() => {
        if(answerSelected !== null){
            // TODO: Enviar a resposta para o servidor
            console.log(`Answer selected: ${answerSelected}`);
        }
    }, [answerSelected]);

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

    const handleConfetti = (e: any) => {
        const rect = e.target.getBoundingClientRect();
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        // Chama o efeito de confete quando o botão é clicado
        confetti({
            particleCount: 100, // Quantidade de partículas
            spread: 60, // Ângulo de dispersão
            origin: { y: y }, // Origem (ajusta a altura do disparo)
        });
    };

    const handleAnswer = (e: any, i: number) => {
        if (timeLeft <= 0) {
            handleNotifyError(`${timeLeft} seconds left to answer!`);
            return;
        }
        if (answerSelected !== null) {
            handleNotifyError("You have already selected an answer!");
            return;
        }
        if (i === correctAnswerIndex){
            if (!isMuted) correctSoundEffect.current().play().then(() => console.log("Correct answer!"));
            handleConfetti(e);
        }
        else{
            if (!isMuted) incorrectSoundEffect.current().play().then(() => console.log("Incorrect answer!"));
        }
        handleSelectAnswer(i);
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
                            players.map((player: any) => {
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
                                                    player.accepted === null ? (
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
                        Qual a melhor linguagem de programação de todos os tempos?
                    </div>

                    {/* Opções */}
                    <div className="options">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                className={`option ${
                                    answerSelected !== null
                                        ? index === correctAnswerIndex
                                            ? "correct" // Destaca a resposta correta
                                            : index === answerSelected
                                                ? "incorrect" // Destaca a resposta errada escolhida
                                                : "default"
                                        : ""
                                }`}
                                onClick={(e) => handleAnswer(e, index)}
                                disabled={answerSelected !== null} // Desativa os botões após a escolha
                            >
                                {option}
                            </button>
                        ))}
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
