import {Schema, type} from "@colyseus/schema";

export class Player extends Schema {
    // @ts-ignore
    @type("string") id: string;
    // @ts-ignore
    @type("string") sessionId: string;
    // @ts-ignore
    @type("string") username: string;
    // @ts-ignore
    @type("string") avatar: string;
    // @ts-ignore
    @type("number") score: number;
    // @ts-ignore
    @type("boolean") isOwner: boolean;
    // @ts-ignore
    @type("boolean") isBestPlayer: boolean;
    // @ts-ignore
    @type("boolean") accepted: null = null;
    // @ts-ignore
    @type("number") answered: number = null;
}
