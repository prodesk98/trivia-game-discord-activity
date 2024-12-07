import {Schema, type} from "@colyseus/schema";


export class Prompt extends Schema {
    @type("string") id: string;
    @type("string") playerId: string;
    @type("string") prompt: string;
    @type("number") likes: number;
}
