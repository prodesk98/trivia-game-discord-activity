import {Player} from "../../schema/Player.ts";

// assets
import accept from "../../assets/icons/accept.png";
import incorrect from "../../assets/icons/incorrect.png";
import trophy from "../../assets/icons/trophy.png";
import {IPlayerList} from "../interfaces/IPlayerList.ts";
import React from "react";


export const PlayerList: React.FC<IPlayerList> = ({ players, hasQuestions, t }) => {
    return (
        players.map((player: Player) => {
            return (
                <div key={player.sessionId}>
                    <div className={`player ${player.isBestPlayer ? "best-player" : ""}`}>
                        <div className="avatar-container">
                            <img
                                src={player.avatar}
                                alt={player.username}
                                className="player-avatar"
                            />
                            {
                                hasQuestions ? (
                                    player.answered > -1 ? (
                                        player.accepted ? (
                                            <img
                                                src={accept}
                                                alt="Correct"
                                                className="icon-correct"
                                            />
                                        ) : (
                                            <img
                                                src={incorrect}
                                                alt="Incorrect"
                                                className="icon-incorrect"
                                            />
                                        )
                                    ): ""
                                ) : ""
                            }
                            {
                                player.isBestPlayer && (
                                    <img
                                        src={trophy}
                                        alt="Best Player"
                                        className="icon-trophy"
                                    />
                                )
                            }
                        </div>
                        <span
                            className="player-name">
                            {player.isMe ? t('You') :
                                player.username.length > 10 ? `${player.username.substring(0, 10)}...` : player.username
                            }
                        </span>
                    </div>
                </div>
            )
        })
    )
}