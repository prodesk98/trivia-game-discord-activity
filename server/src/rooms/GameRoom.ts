import { Room, Client } from "@colyseus/core";
import { GameState } from "./schema/GameState";

import { JWT } from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResult} from "./schema/messages/answerResult";

export class GameRoom extends Room<GameState> {
  maxClients = 5;

  static onAuth (token: string) {
    return JWT.verify(token);
  }

  onCreate (options: any) {
    this.setState(new GameState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      const correctAnswer = this.state.getCorrectAnswer();
      player.score += this.state.calculateScore(message.response, correctAnswer);

      this.send(client, new AnswerResult(message.response, correctAnswer == message.response));
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.id = client.sessionId; // TODO: assign a unique ID
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || "Guest";
    player.avatar = client.auth?.avatar || "https://robohash.org/" + player.username;
    player.score = 0;
    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
