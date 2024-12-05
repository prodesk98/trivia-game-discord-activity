import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

import { v4 as uuid4 } from "uuid";

import {JWT} from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResponse} from "./schema/messages/AnswerResponse";
import {Delayed} from "colyseus";
import {QuestionOptions} from "./schema/QuestionOptions";
import {ErrorResponse} from "./schema/messages/ErrorResponse";
import {createScore} from "../database/DBSession";


export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  roundId: string;
  questionOptions: QuestionOptions[] = new Array<QuestionOptions>();
  currentQuestionIndex = 0;
  answerOptions: number[] = [];
  timer: Delayed;
  timeOut: Delayed;

  // TODO: uncomment this
  // static onAuth (token: string) {
  //   return JWT.verify(token);
  // }

  onCreate (options: any) {
    this.setState(new TriviaGameState());

    // player send answer
    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      // check if the player has already answered
      const correct = this.answerOptions[this.currentQuestionIndex];

      let score = this.calculateScore(message.answer, correct);
      let accepted = correct === message.answer;

      if (accepted) createScore(player.userId, this.roundId, score).then();

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
      for (const [sessionId, player] of this.state.players) {
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
        if (client.sessionId !== this.state.owner && !this.state.gameStarted) {
            client.send(new ErrorResponse("Only the owner can start the game!"));
            return;
        }
        // check if there are enough players
        // TODO: uncomment this
        // if (this.state.players.size < 2) {
        //     client.send(new ErrorResponse("Not enough players to start the game!"));
        //     return;
        // }
        // TODO: generate question options using API GenAI

        this.roundId = uuid4();
        this.startGame(message.prompt).then();
    });
    if (process.env.NODE_ENV !== "production") {
      // TODO: remove this
      this.onMessage("testStartGame", (client, message) => {
          this.startGame(message.prompt).then();
      });

      // TODO: remove this
      this.onMessage("testScore", (client, message) => {
        const player = this.state.players.get(client.sessionId);
        player.score += 1;
        // apply score state
        this.state.players.set(client.sessionId, player);
      });

      // TODO: remove this
      this.onMessage("testAccepted", (client, message) => {
        const player = this.state.players.get(client.sessionId);
        player.accepted = true;
      });

      // TODO: remove this
      this.onMessage("testGameOver", (client, message) => {
        this.state.gameOver = true;
        this.state.currentTimer = 0;
        this.broadcast("gameOver", {});
      });
    }
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.id = client.auth?.discordId || null;
    player.userId = client.auth?.userId || null;
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || `Guest-${Math.floor(Math.random() * 100)}`;
    player.avatar = client.auth?.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(Math.floor(Math.random() * 5).toString())}.png`;
    player.isBestPlayer = false;
    player.accepted = false;
    player.answered = -1;
    player.lack = true;
    player.isOwner = client.sessionId === this.state.owner;
    player.score = 0;

    if (!player.avatar.startsWith("https://")) {
      player.avatar = `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png?size=256`;
    }
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
    // unlock the room if it's not full
    if (this.state.players.size < this.maxClients) {
      this.unlock().then();
      console.log(`${this.roomId} is now unlocked!`);
    }

    if (this.state.owner === client.sessionId) {
      // assign a new owner
      this.state.owner = this.state.players.keys().next().value;
      console.log(`${this.state.owner} is the owner!`);
    }
  }

  onDispose() {
    console.log(`${this.roomId} disposed!`);
  }

  calculateScore(response: number, correct: number) {
    return (correct === response ? 1 : 0) * this.state.currentTimer;
  }

  async startGame(prompt: string) {
    this.totalTurns = 0;

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
    const data = await response.json();
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
    this.broadcast("next", {});
  }

  resetPlayerAnswers() {
    for (const [sessionId, player] of this.state.players) {
        player.accepted = false;
        player.answered = -1;
        player.lack = true;
        this.state.players.set(sessionId, player);
    }
  }

  endGame() {
      // clear the timer
      if (this.timer) this.timer.clear();
      if (this.timeOut) this.timeOut.clear();

      // set game over state
      this.state.gameOver = true;
      this.state.gameStarted = false;
      this.state.gameEnded = true;

      // clear player answers
      this.resetPlayerAnswers();

      // clear local state
      this.totalTurns = 0;
      // this.questionOptions = [];
      this.currentQuestionIndex = 0;
      this.state.currentQuestionOptions = null;
      // this.answerOptions = [];

      // broadcast game over
      this.broadcast("gameOver", {});
  }

  tickGameTimer() {
    this.state.currentTimer -= 1;
    if (this.state.currentTimer <= 0 && !this.state.gameOver) {
      this.timer.clear();
      this.endTurn();
    }
  }

  endTurn() {
    this.totalTurns++;
    if (this.totalTurns >= this.questionOptions.length) {
        this.endGame();
        return;
    }
    this.state.currentAnswer = this.answerOptions[this.currentQuestionIndex];

    // clear the timer
    if(this.timer) this.timer.clear();

    // next turn
    this.timeOut = this.clock.setTimeout(() => this.nextTurn(), 3000);
  }

  nextTurn() {
    this.state.gameStarted = true;
    this.state.gameEnded = false;
    this.state.gameOver = false;
    this.currentQuestionIndex = this.totalTurns;
    this.state.currentQuestionOptions = this.questionOptions[this.currentQuestionIndex];
    this.state.currentAnswer = this.answerOptions[this.currentQuestionIndex];

    // reset player answers
    this.resetPlayerAnswers();

    // clear the timeout
    if(this.timeOut) this.timeOut.clear();

    // broadcast the next question
    this.broadcast("next", {i: this.currentQuestionIndex});

    // start the timer
    if (this.state.currentTimer < 30) this.state.currentTimer = 30;
    this.timer = this.clock.setInterval(() => this.tickGameTimer(), 1000);
  }
}
