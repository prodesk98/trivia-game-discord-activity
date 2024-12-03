import confetti from "canvas-confetti";
import {IConfetti} from "../components/interfaces/IConfetti.tsx";


export const handleConfetti = ({ rectTop, rectHeight }: IConfetti) => {
    const y = (rectTop + rectHeight / 2) / window.innerHeight;

    // Chama o efeito de confete quando o botão é clicado
    confetti({
        particleCount: 100, // Quantidade de partículas
        spread: 60, // Ângulo de dispersão
        origin: { y: y }, // Origem (ajusta a altura do disparo)
    });
};