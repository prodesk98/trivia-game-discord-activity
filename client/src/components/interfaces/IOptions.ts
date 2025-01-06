
export interface IOptionsGameProps {
    options: string[];
    answerCorrect: number;
    answerSelected: number;
    translate: (key: string) => string;
    handleAnswer: (e: any, index: number) => void;
}
