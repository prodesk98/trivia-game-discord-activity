import {IOptionsGameProps} from "../interfaces/IOptions.ts";
import React from "react";


export const OptionsGame: React.FC<IOptionsGameProps> = ({ options, answerCorrect, answerSelected, handleAnswer, translate }) => {
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
                                {translate(option)}
                            </button>
                        )
                    ) : ""
                }
            </div>
        </>
    )
}