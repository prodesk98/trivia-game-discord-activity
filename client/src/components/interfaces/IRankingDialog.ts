import {Player} from "../../schema/Player.ts";

export interface IRankingDialog {
    players: Player[];
    t: (key: string) => string;
}
