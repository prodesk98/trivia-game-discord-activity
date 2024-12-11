import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

import { v4 as uuid4 } from "uuid";

import {JWT} from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResponse} from "./schema/messages/AnswerResponse";
import {Delayed} from "colyseus";
import {QuestionOptions} from "./schema/QuestionOptions";
import {ErrorResponse} from "./schema/messages/ErrorResponse";
import {
    createRoom,
    createScore,
    getSumScoreByRoomIdAndUserId, getSumScoreByUserIdAndRoundId
} from "../database/DBSession";


export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  roundId: string;
  questionOptions: QuestionOptions[] = new Array<QuestionOptions>();
  currentQuestionIndex = 0;
  answerOptions: number[] = [];
  timerChoose: Delayed;
  timerGame: Delayed;
  timeOut: Delayed;

  static onAuth (token: string) {
    if (process.env.NODE_ENV !== "production") return;
    return JWT.verify(token);
  }

  async onCreate (options: any) {
    this.setState(new TriviaGameState());

    // player send answer
    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      // check if the player has already answered
      const correct = this.answerOptions[this.currentQuestionIndex];

      let score = this.calculateScore(message.answer, correct);
      let accepted = correct === message.answer;

      if (accepted) createScore(player.userId, this.roundId, this.roomId, score).then();

      player.score += score;
      player.accepted = accepted;
      player.answered = message.answer;
      player.lack = false; // player has answered

      const answerFeedback = new AnswerResponse();
      answerFeedback.answered = player.answered;
      answerFeedback.correct = correct;
      answerFeedback.score = score;
      answerFeedback.accepted = accepted;
      answerFeedback.rectTop = message.rectTop;
      answerFeedback.rectHeight = message.rectHeight;

      // check if all players have answered
      let countAnswered = 0;
      for (const [_, player] of this.state.players) {
        if (player.lack === false) countAnswered++;
      }

      if (countAnswered === this.state.players.size) {
        this.endTurn();
      }

      // send feedback to the player
      client.send("answerFeedback", answerFeedback);
    });

    // owner can start the game
    // end lobby phase and start the game
    this.onMessage("startGame", (client, message) => {
        console.log(`${client.sessionId} started the game!`);
        // check if the client is the owner
        if (client.sessionId !== this.state.owner && !this.state.gameLobby) {
            client.send("error", new ErrorResponse({message: "You are not the owner!"}));
            return;
        }
        this.roundId = uuid4();
        this.startGame(message.prompt).then();
    });

    // find all categories
    this.state.categories = await this.getCategories();

    // create room
    createRoom(options.guildId, this.roomId).then();
  }

  async onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.id = client.auth?.discordId || null;
    player.userId = client.auth?.userId || null;
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || `Guest-${Math.floor(Math.random() * 100)}`;
    player.avatar = client.auth?.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(Math.floor(Math.random() * 5).toString())}.png`;
    player.language = client.auth?.language || "en";
    player.accepted = false;
    player.answered = -1;
    player.lack = true;
    // @ts-ignore
    player.score = await getSumScoreByRoomIdAndUserId(player.userId, this.roomId);

    if (!player.avatar.startsWith("https://")) player.avatar = `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png?size=256`;
    this.state.players.set(client.sessionId, player);

    // assign the owner if there's no owner
    if (this.state.players.size == 1) {
      this.state.owner = client.sessionId;
      this.timeOut = this.clock.setTimeout(() => this.nextOwner(), 3000);
      console.log(`${this.state.owner} is the owner!`);
    }

  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
    // unlock the room if it's not full
    if (this.state.players.size < this.maxClients) {
      this.unlock().then();
      console.log(`${this.roomId} is now unlocked!`);
    }

    if (this.state.owner === client.sessionId) {
      // assign a new owner
      this.state.owner = this.state.players.keys().next().value;
      console.log(`${this.state.owner} is the owner!`);

      if (this.state.gameLobby) {
          this.nextOwner();
      }
    }

    let countAnswered = 0;
    for (const [sessionId, player] of this.state.players) {
        if (player.sessionId === client.sessionId) this.state.players.delete(sessionId);
        if (player.lack === false) countAnswered++;
    }

    if (countAnswered === this.state.players.size) this.endTurn();
  }

  onDispose() {
    console.log(`${this.roomId} disposed!`);
  }

  calculateScore(response: number, correct: number) {
    return (correct === response ? 1 : 0) * this.state.currentTimer;
  }

  async startGame(prompt: string) {
    this.totalTurns = 0;
    this.state.theme = prompt;
    this.stopChoose();

    try {
        const response = await fetch(
            `${process.env.QUIZGENAI_ENDPOINT}/generative`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.QUIZGENAI_API_KEY}`
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            }
        )
        const data: any = await response.json();
        this.questionOptions = data.questionnaires.map((q: any) => {
            return new QuestionOptions({
                id: q.id,
                question: q.question,
                options: q.options,
                correct: q.answer,
            });
        });

        this.answerOptions = this.questionOptions.map(q => q.correct);

        this.nextTurn();
    }catch (e) {
        console.error(e);
        this.broadcast("error", new ErrorResponse({message: "Error generating questions!"}));
        this.startLobby();
    }
  }

  async getCategories(): Promise<string[]> {
    try {
        const response = await fetch(
            `${process.env.QUIZGENAI_ENDPOINT}/categories`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.QUIZGENAI_API_KEY}`
                }
            }
        )
        const data: any = await response.json();
        return data.categories;
    }catch (e) {
        console.error(e);
    }
  }

  async resetPlayers() {
    for (const [sessionId, player] of this.state.players) {
        player.accepted = false;
        player.answered = -1;
        player.lack = true;
        // @ts-ignore
        player.score = await getSumScoreByUserIdAndRoundId(player.userId, this.roundId);
        this.state.players.set(sessionId, player);
    }
  }

  endGame() {
      // clear the timer
      if (this.timerGame) this.timerGame.clear();
      if (this.timeOut) this.timeOut.clear();

      // set game over state
      this.state.gameOver = true;
      this.state.gameLobby = true;
      this.state.gameStarted = false;
      this.state.gameEnded = true;

      // clear players
      this.resetPlayers().then();

      // clear local state
      this.totalTurns = 0;
      // this.questionOptions = [];
      this.currentQuestionIndex = 0;
      this.state.currentQuestionOptions = null;
      // this.answerOptions = [];

      // start the lobby timer
      this.timeOut = this.clock.setTimeout(() => this.nextOwner(), 10000);

      // broadcast game over
      this.broadcast("gameOver", {});
  }

  tickChooseTimer() {
    this.state.timerClock -= 1;
    if (this.state.timerClock <= 0) {
        this.timerChoose.clear();
        this.nextOwner();
    }
  }

  startLobby() {
    this.timeOut.clear();
    this.state.gameLobby = true;
    this.state.gameStarted = false;
    this.state.gameEnded = false;
    this.state.gameOver = false;
    this.state.theme = null;
    this.state.currentAnswer = -1;
    this.state.currentQuestionOptions = null;
    this.state.timerClock = 30;
    this.timerChoose = this.clock.setInterval(() => this.tickChooseTimer(), 1000);
  }

  calculateNextOwner() {
      const players = Array.from(this.state.players.keys());
      if (players.length === 1) return players[0];

      const currentIndex = players.findIndex((sessionId) => sessionId === this.state.owner);

      const nextIndex = (currentIndex + 1) % players.length;

      return players[nextIndex];
  }

  nextOwner() {
    this.state.owner = this.calculateNextOwner();
    this.state.timerClock = 30;
    if(this.timerChoose) this.timerChoose.clear();
    this.startLobby();
  }

  tickGameTimer() {
    this.state.currentTimer -= 1;
    if (this.state.currentTimer <= 0 && !this.state.gameOver) {
      this.timerGame.clear();
      this.endTurn();
    }
  }

  stopChoose() {
      if (this.timerChoose) this.timerChoose.clear();
      // this.state.owner = this.calculateNextOwner();
  }

  endTurn() {
    this.totalTurns++;
    if (this.totalTurns >= this.questionOptions.length) {
        this.endGame();
        return;
    }
    this.state.currentAnswer = this.answerOptions[this.currentQuestionIndex];

    // clear the timer
    if(this.timerGame) this.timerGame.clear();

    // next turn
    this.timeOut = this.clock.setTimeout(() => this.nextTurn(), 3000);
  }

  nextTurn() {
    this.state.gameStarted = true;
    this.state.gameLobby = false;
    this.state.gameEnded = false;
    this.state.gameOver = false;
    this.currentQuestionIndex = this.totalTurns;
    this.state.currentQuestionOptions = this.questionOptions[this.currentQuestionIndex];
    this.state.currentAnswer = this.answerOptions[this.currentQuestionIndex];

    // reset player answers
    this.resetPlayers().then();

    // clear the timeout
    if(this.timeOut) this.timeOut.clear();

    // broadcast the next question
    this.broadcast("next", {i: this.currentQuestionIndex});

    // start the timer
    if (this.state.currentTimer < 30) this.state.currentTimer = 30;
    this.timerGame = this.clock.setInterval(() => this.tickGameTimer(), 1000);
  }
}
