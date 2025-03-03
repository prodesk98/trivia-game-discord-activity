import {Player} from "../../schema/Player.ts";


export interface IPlayerList {
    players: Player[];
    hasQuestions: boolean;
    t: (key: string) => string;
}