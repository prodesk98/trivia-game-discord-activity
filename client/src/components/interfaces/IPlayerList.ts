import {Player} from "../../schema/Player.ts";


export interface IPlayerList {
    players: Player[];
    answerSelected: number;
}