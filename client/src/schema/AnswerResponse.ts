import {Schema, type} from "@colyseus/schema";


export class AnswerResponse extends Schema {
    // @ts-ignore
    @type("number") answered: number;
    // @ts-ignore
    @type("number") correct: number;
    // @ts-ignore
    @type("number") score: number;
    // @ts-ignore
    @type("boolean") accepted: boolean;
    // @ts-ignore
    @type("number") rectTop: number;
    // @ts-ignore
    @type("number") rectHeight: number;
}