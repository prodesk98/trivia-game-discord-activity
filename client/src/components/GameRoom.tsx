import {useEffect, useRef, useState} from "react";
// assets
import accept from "../assets/icons/accept.png";
import incorrect from "../assets/icons/incorrect.png";
import trophy from "../assets/icons/trophy.png";
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


export default function GameRoom(){
    const [timeLeft, setTimeLeft] = useState(30); // 30 segundos para responder
    const [isMuted, setIsMuted] = useState(false); // Mudo ou não
    const [answerSelected, setAnswerSelected] = useState(null); // Resposta selecionada
    const [showDialog, setShowDialog] = useState(false); // Exibe o diálogo de saída
    const totalTime = 30; // Tempo total da pergunta
    const correctAnswerIndex = 2; // Resposta correta
    const options = ["C++", "C#", "Python", "Javascript"]; // Opções de resposta


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

    // Lista de jogadores
    const players = [
        { id: 1, name: "Você", avatar: "https://i.pravatar.cc/54", accept: true, best: false },
        { id: 3, name: "Player3", avatar: "https://i.pravatar.cc/54", accept: true, best: true },
        { id: 2, name: "Player2", avatar: "https://i.pravatar.cc/54", accept: false, best: false },
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
    }, [isMuted]);

    // Seleciona a resposta
    const handleSelectAnswer = (i: number) => {
        // @ts-ignore
        setAnswerSelected(i);
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

    const handleLeaveGame = () => {};

    const handleExitClick = () => {
        setShowDialog(true); // Exibe o diálogo
    };

    const confirmExit = () => {
        console.log("Usuário saiu do jogo!");
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
                        {options.map((option, index) => (
                            <button
                                key={index}
                                className={`option ${
                                    answerSelected !== null
                                        ? index === correctAnswerIndex
                                            ? "correct" // Destaca a resposta correta
                                            : index === answerSelected
                                                ? "incorrect" // Destaca a resposta errada escolhida
                                                : ""
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
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                </button>
                <button className="btn-exit" onClick={() => handleExitClick()}>
                    <ExitToAppIcon />
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
