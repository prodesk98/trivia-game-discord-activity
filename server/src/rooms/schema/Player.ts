import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string;
    @type("string") sessionId: string;
    @type("string") username: string;
    @type("string") avatar: string;
    @type("number") score: number;
}
