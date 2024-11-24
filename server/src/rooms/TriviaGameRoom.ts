import { Room, Client } from "@colyseus/core";
import { TriviaGameState } from "./schema/TriviaGameState";

import { JWT } from "@colyseus/auth";
import { Player } from "./schema/Player";
import { AnswerResponse } from "./schema/messages/AnswerResponse";
import { Delayed } from "colyseus";
import { QuestionOptions } from "./schema/QuestionOptions";

export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  questionOptions: QuestionOptions[] = [];
  timer: Delayed;

  static onAuth (token: string) {
    return JWT.verify(token);
  }

  onCreate (options: any) {
    this.setState(new TriviaGameState());

    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      const correctAnswer = this.getCorrectAnswer();
      player.score += this.calculateScore(message.response, correctAnswer);

      this.send(client, new AnswerResponse(message.response, correctAnswer == message.response));
    });

    this.onMessage("startGame", (client, message) => {
        console.log(`${client.sessionId} started the game!`);
        if (client.sessionId !== this.state.owner && !this.state.gameStarted) {
            return;
        }
        // TODO: generate question options using API GenAI
        this.startGame();
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.id = client.auth?.id || null;
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || "Guest";
    player.avatar = client.auth?.avatar || "https://robohash.org/" + player.username;
    player.score = 0;

    // kick the player if they don't have an ID
    if (player.id == null) client.leave();

    this.state.players.set(client.sessionId, player);

    // assign the owner if there's no owner
    if (this.state.players.size === 1) {
      this.state.owner = client.sessionId;
      console.log(`${this.state.owner} is the owner!`);
    }

    // lock the room if it's full
    if (this.state.players.size === this.maxClients) {
      this.lock().then();
      console.log(`${this.roomId} is now locked!`);
    }
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log(`${this.roomId} disposed!`);
  }

  getCorrectAnswer() {
    return 1; // TODO: query the database for the correct answer
  }

  calculateScore(response: number, correct: number) {
    return (correct === response ? 1 : 0) * this.state.currentTimer;
  }

  getPlayerBySessionId(sessionId: string) {
    return this.state.players.get(sessionId);
  }

  getBestPlayer() {
    let bestPlayer = null;
    for (let player of this.state.players.values()) {
      if (this.state.bestPlayer == null || player.score > this.state.players.get(this.state.bestPlayer).score) {
        bestPlayer = player.id;
      }
    }
    this.state.bestPlayer = bestPlayer;
    this.broadcast("playerUpdate", this.getPlayerBySessionId(bestPlayer));
  }

  startGame() {
    this.state.gameStarted = true;
    this.state.currentTimer = 30;
    this.timer = this.clock.setInterval(() => this.tickGameTimer(), 1000);
    this.totalTurns = 0;
    this.state.gameOver = false;
    this.state.currentQuestionOptions = this.questionOptions[this.totalTurns];
    this.broadcast("nextTurn", this.state.currentQuestionOptions);
  }

  tickGameTimer() {
    this.state.currentTimer -= 1;
    if (this.state.currentTimer <= 0) {
      this.timer.clear();
      this.endTurn();
    }
    this.broadcast("currentTimer", this.state.currentTimer);
  }

  endTurn() {
    this.state.currentTimer = 30;
    this.totalTurns++;
    if (this.totalTurns > this.questionOptions.length) {
        this.state.gameOver = true;
        this.broadcast("gameOver");
        return;
    }
    this.getBestPlayer();
    if (this.state.gameOver) {
        return;
    }
    this.broadcast("nextTurn");
  }

  nextTurn() {
    this.state.currentQuestionOptions = this.questionOptions[this.totalTurns];
    this.broadcast("nextTurn", this.state.currentQuestionOptions);
  }
}
