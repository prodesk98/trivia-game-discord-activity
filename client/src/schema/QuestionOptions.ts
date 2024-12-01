import {Schema, type} from "@colyseus/schema";


export class QuestionOptions extends Schema {
    // @ts-ignore
    @type("string") id: string;
    // @ts-ignore
    @type("string") question: string = null;
    // @ts-ignore
    @type(["string"]) options: string[];
}
