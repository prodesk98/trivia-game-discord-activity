import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

// import {JWT} from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResponse} from "./schema/messages/AnswerResponse";
import {Delayed} from "colyseus";
import {QuestionOptions} from "./schema/QuestionOptions";
import {ErrorResponse} from "./schema/messages/ErrorResponse";

export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  questionOptions: QuestionOptions[] = new Array<QuestionOptions>();
  timer: Delayed;

  // TODO: implement JWT authentication
  // static onAuth (token: string) {
  //   return JWT.verify(token);
  // }

  onCreate (options: any) {
    this.setState(new TriviaGameState());

    // player send answer
    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      const correctAnswer = this.getCorrectAnswer();
      player.score += this.calculateScore(message.response, correctAnswer);

      client.send(new AnswerResponse(message.response, correctAnswer == message.response));
    });

    // owner can start the game
    // end lobby phase and start the game
    this.onMessage("startGame", (client, message) => {
        console.log(`${client.sessionId} started the game!`);
        // check if the client is the owner
        if (client.sessionId !== this.state.owner && !this.state.gameStarted) {
            client.send(new ErrorResponse("Only the owner can start the game!"));
            return;
        }
        // check if there are enough players
        if (this.state.players.size < 2) {
            client.send(new ErrorResponse("Not enough players to start the game!"));
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
    player.isBestPlayer = false;
    player.isOwner = client.sessionId === this.state.owner;
    player.score = 0;

    this.state.players.set(client.sessionId, player);

    // assign the owner if there's no owner
    if (this.state.players.size == 1) {
      this.state.owner = client.sessionId;
      console.log(`${this.state.owner} is the owner!`);
    }

    // lock the room if it's full
    if (this.state.players.size >= this.maxClients) {
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
    return this.state.currentQuestionOptions.correctAnswer;
  }

  calculateScore(response: number, correct: number) {
    return (correct === response ? 1 : 0) * this.state.currentTimer;
  }

  getBestPlayer() {
    let bestPlayer = null;
    for (let player of this.state.players.values()) {
      if (this.state.bestPlayer == null || player.score > this.state.players.get(this.state.bestPlayer).score) {
        bestPlayer = player.id;
      }
    }
    this.state.bestPlayer = bestPlayer;
  }

  startGame() {
    this.totalTurns = 0;
    this.broadcast("next", this.state.currentQuestionOptions);
  }

  tickGameTimer() {
    this.state.currentTimer -= 1;
    if (this.state.currentTimer <= 0) {
      this.timer.clear();
      this.endTurn();
    }
  }

  endTurn() {
    this.state.currentTimer = 30;
    this.totalTurns++;
    if (this.totalTurns > this.questionOptions.length) {
        this.state.gameOver = true;
        this.broadcast("gameOver");
        this.disconnect().then();
        return;
    }
    this.getBestPlayer();
    if (this.state.gameOver) {
        return;
    }
    this.nextTurn();
  }

  nextTurn() {
    this.state.gameStarted = true;
    this.state.gameOver = false;
    this.state.currentTimer = 30;
    this.timer = this.clock.setInterval(() => this.tickGameTimer(), 1000);
    this.state.currentQuestionOptions = this.questionOptions[this.totalTurns];
    this.broadcast("next", this.state.currentQuestionOptions);
  }
}
