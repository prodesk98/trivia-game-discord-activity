import {Player} from "../../schema/Player.ts";

export interface ILeaderboard {
    players: Player[];
    t: (key: string) => string;
}
