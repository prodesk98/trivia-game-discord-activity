import {IOptionsGameProps} from "../interfaces/IOptions.tsx";
import React from "react";


export const OptionsGame: React.FC<IOptionsGameProps> = ({ options, answerCorrect, answerSelected, handleAnswer }) => {
    return (
        <>
            <div className="options">
                {
                    options.length > 0 ?
                    options.map(
                        (option, index) => (
                            <button
                                key={index}
                                className={`option ${
                                    answerCorrect > -1
                                        ? index === answerCorrect
                                            ? "correct" // Destaca a resposta correta
                                            : answerSelected === index ?
                                                "incorrect" :
                                                "default" // Destaca a resposta incorreta
                                        : ""
                                }`}
                                onClick={(e) => handleAnswer(e, index)}
                                disabled={answerSelected > -1} // Desativa os botões após a escolha
                            >
                                {option}
                            </button>
                        )
                    ) : ""
                }
            </div>
        </>
    )
}