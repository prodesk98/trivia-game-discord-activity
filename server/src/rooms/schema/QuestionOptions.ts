import {Schema, type} from "@colyseus/schema";


export class QuestionOptions extends Schema {
    @type("string") id: string;
    @type("string") question: string;
    @type(["string"]) options: string[];
}
