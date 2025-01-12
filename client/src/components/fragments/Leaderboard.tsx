import {Player} from "../../schema/Player.ts";
import React from "react";
import {ILeaderboard} from "../interfaces/ILeaderboard.ts";


export const Leaderboard: React.FC<ILeaderboard> = ({ players, t }) => {
    // sort players by score
    players.sort((a: Player, b: Player) => b.score - a.score);
    return (
        <>
            <div className="leaderboard-container">
                <h2>{t('Result')}</h2>
                <div className="leaderboard">
                    {players.map((player: Player, index: number) => (
                        <div
                            key={index}
                            className={`leaderboard-item ${index === 0 ? "first" : index === 1 ? "second" : index === 2 ? "third" : ""}`}
                        >
                            <div className="rank-avatar">
                                <span className="rank">{index + 1}</span>
                                <img src={player.avatar} alt={player.username} className="avatar"/>
                            </div>
                            <span className="username">{player.isMe ? t('You') : player.username}</span>
                            <span className="points">{player.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}