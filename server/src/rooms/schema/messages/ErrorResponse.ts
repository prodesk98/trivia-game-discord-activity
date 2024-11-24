import {Schema, type} from "@colyseus/schema";


export class ErrorResponse extends Schema {
    @type("string") message: string;
}
