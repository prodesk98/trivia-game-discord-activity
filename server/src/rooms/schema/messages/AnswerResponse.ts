import {Schema, type} from "@colyseus/schema";


export class AnswerResponse extends Schema {
    @type("number") response: number;
    @type("number") correct: boolean;
}
