import {Schema, type} from "@colyseus/schema";


export class AnswerResponse extends Schema {
    @type("number") answered: number;
    @type("number") correct: number;
    @type("number") score: number;
    @type("boolean") accepted: boolean;
    @type("number") rectTop: number;
    @type("number") rectHeight: number;
}
