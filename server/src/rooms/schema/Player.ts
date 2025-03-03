import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
    @type("string") id: string;
    @type("string") userId: string;
    @type("string") sessionId: string;
    @type("string") username: string;
    @type("string") avatar: string;
    @type("number") score: number;
    @type("string") language: string;
    @type("boolean") isMe: boolean = false;
    @type("boolean") isBestPlayer: boolean = false;
    @type("boolean") accepted: boolean = false;
    @type("number") answered: number = -1;
    @type("boolean") lack: boolean = true;
}
