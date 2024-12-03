
export interface IOptionsGameProps {
    options: string[];
    answerCorrect: number;
    answerSelected: number;
    handleAnswer: (e: any, index: number) => void;
}
