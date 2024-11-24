import {Schema, type} from "@colyseus/schema";


export class PlayerUpdate extends Schema {
    @type("string") id: string;
    @type("string") username: string;
    @type("string") avatar: string;
    @type("number") score: number;
}
