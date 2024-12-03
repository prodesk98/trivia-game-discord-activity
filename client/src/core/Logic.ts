import {Player} from "../schema/Player.ts";


export const handleCalculatePosition = (players: Player[], mySessionId: string) => {
    // my player
    let me: Player | undefined = players.find((player) => player.sessionId === mySessionId);

    // remove me from players
    players = players.filter((player) => player.sessionId !== mySessionId);

    // sort players by score
    players.sort((a, b) => b.score - a.score);

    // insert my session in first position
    if (me) players = [me, ...players];

    // first player is the best player
    if (players.length > 1) {
        const bestPlayer = players[1];
        players.forEach((player) => player.isBestPlayer = player === bestPlayer && bestPlayer.score > 0);

        // set me as best player
        if (me && bestPlayer.score < me.score) {
            me.isBestPlayer = true;
            bestPlayer.isBestPlayer = false;
        }
    }else{
        players.forEach((player) => player.isBestPlayer = player.score > 0);
    }

    return players;
}
