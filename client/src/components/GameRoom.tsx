import {useEffect, useRef, useState} from "react";
//assets
import accept from "../assets/icons/accept.png";
import incorrect from "../assets/icons/incorrect.png";
import trophy from "../assets/icons/trophy.png";
import correctSound from "../assets/sounds/correct-answer.wav";
import backgroundMusicGameTimer from "../assets/sounds/music-game-timer.wav";

// css
import "../css/GameRoom.css";

import confetti from "canvas-confetti";

import {Bounce, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function GameRoom(){
    const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para responder
    const totalTime = 30; // Tempo total da pergunta

    // Efeito sonoro de resposta correta
    const correctSoundEffect = useRef(() => {
        const audio = new Audio(correctSound);
        audio.volume = 0.8;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    // Lista de jogadores
    const players = [
        { id: 1, name: "Player1", avatar: "https://i.pravatar.cc/54", accept: true, best: false },
        { id: 2, name: "Player2", avatar: "https://i.pravatar.cc/54", accept: false, best: false },
        { id: 3, name: "Player3", avatar: "https://i.pravatar.cc/54", accept: true, best: true },
        { id: 4, name: "Player4", avatar: "https://i.pravatar.cc/54", accept: false, best: false },
        { id: 5, name: "Player5", avatar: "https://i.pravatar.cc/54", accept: false, best: false },
    ];

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // background music
    // TODO: Purchase the full track: https://1.envato.market/WDQBgA
    useEffect(() => {
        const audio = new Audio(backgroundMusicGameTimer);
        audio.loop = true;
        audio.volume = 0.08;
        audio.play().then(() => console.log("Background music started!"));
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

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

    const handleAnswer = (e: any) => {
        if (timeLeft <= 0) {
            handleNotifyError(`${timeLeft} seconds left to answer!`);
            return;
        }

        correctSoundEffect.current().play().then(() => console.log("Correct answer!"));
        handleConfetti(e);
    }

    const progressPercentage = (timeLeft / totalTime) * 100;

    return (
        <div className="quiz-wrapper">
            <div className="quiz-container">
                {/* Lista de jogadores no topo */}
                <div className="players-list">
                    {players.map((player) => (
                        <div className={`player ${player.best ? "best-player" : ""}`} key={player.id}>
                            <div className="avatar-container">
                                <img
                                    src={`${player.avatar}?img=${player.id}`}
                                    alt={player.name}
                                    className="player-avatar"
                                />
                                {player.accept ? (
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
                                )}
                                {player.best && (
                                    <img
                                        src={trophy}
                                        alt="Best Player"
                                        className="icon-trophy"
                                    />
                                )}
                            </div>
                            <span className="player-name">{player.name}</span>
                        </div>
                    ))}
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
                    <button className="option" onClick={handleAnswer}>C++</button>
                    <button className="option" onClick={handleAnswer}>C#</button>
                    <button className="option correct" onClick={handleAnswer}>Python</button>
                    <button className="option" onClick={handleAnswer}>Javascript</button>
                </div>
            </div>
        </div>
    )
}
