import {useEffect, useRef, useState} from "react";
//assets
import accept from "../assets/icons/accept.png";
import incorrect from "../assets/icons/incorrect.png";
import trophy from "../assets/icons/trophy.png";
import correctSound from "../assets/sounds/correct-answer.wav";

// css
import "../css/GameRoom.css";

import confetti from "canvas-confetti";

export default function GameRoom(){
    const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para responder
    const totalTime = 30; // Tempo total da pergunta
    const soundEffectRef = useRef(new Audio(correctSound));

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

    const handleConfetti = (e: any) => {
        const rect = e.target.getBoundingClientRect();
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        soundEffectRef.current.currentTime = 0;
        soundEffectRef.current.play().then(() => console.log("Audio played!"));

        // Chama o efeito de confete quando o botão é clicado
        confetti({
            particleCount: 100, // Quantidade de partículas
            spread: 60, // Ângulo de dispersão
            origin: { y: y }, // Origem (ajusta a altura do disparo)
        });
    };

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
                    In vanilla Minecraft, which of the following cannot be made into a block?você!é
                </div>

                {/* Opções */}
                <div className="options">
                    <button className="option" onClick={handleConfetti}>String</button>
                    <button className="option" onClick={handleConfetti}>Coal</button>
                    <button className="option" onClick={handleConfetti}>Wheat</button>
                    <button className="option correct" onClick={handleConfetti}>Charcoal</button>
                </div>
            </div>
        </div>
    )
}
