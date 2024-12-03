import {Player} from "../../schema/Player.ts";
import React from "react";
import {ILeaderboard} from "../interfaces/ILeaderboard.tsx";


export const Leaderboard: React.FC<ILeaderboard> = ({ players }) => {
    // sort players by score
    players.sort((a: Player, b: Player) => b.score - a.score);
    return (
        <>
            <div className="leaderboard-container">
                <h2>Result</h2>
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
                            <span className="username">{player.username}</span>
                            <span className="points">{player.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}