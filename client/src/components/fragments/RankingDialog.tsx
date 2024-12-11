import {IRankingDialog} from "../interfaces/IRankingDialog.ts";
import React from "react";
import {Player} from "../../schema/Player.ts";


export const RankingDialog: React.FC<IRankingDialog> = ({ players, t }) => {
    players.sort((a: Player, b: Player) => b.score - a.score);
    return (
        <>
            {players.map((player, index) => (
                <div className={`leaderboard-item rank-${index + 1}`} key={player.id}>
                    <div className="player-name">
                        <div className="player-icon"
                             style={
                                 {
                                     backgroundImage: `url(${player.avatar})`,
                                     backgroundSize: 'cover',
                                 }
                             }></div>
                        <p>{player.isMe ? t("You") : player.username}</p>
                    </div>
                    <div className="player-score">{player.score}</div>
                </div>
            ))}
        </>
    )
}