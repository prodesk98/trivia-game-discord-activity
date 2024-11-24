import {Schema} from "@colyseus/schema";


export class AnswerResult extends Schema {
    response: number;
    correct: boolean;

    constructor(response: number, correct: boolean) {
        super();
        this.response = response;
        this.correct = correct;
    }
}