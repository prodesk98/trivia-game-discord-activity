import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

// import {JWT} from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResponse} from "./schema/messages/AnswerResponse";
import {Delayed} from "colyseus";
import {QuestionOptions} from "./schema/QuestionOptions";
import {ErrorResponse} from "./schema/messages/ErrorResponse";
import {db} from "../database/DBClient";


export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  questionOptions: QuestionOptions[] = new Array<QuestionOptions>();
  correctAnswer: number = 1;
  timer: Delayed;

  // prisma client


  // TODO: implement JWT authentication
  // static onAuth (token: string) {
  //   return JWT.verify(token);
  // }

    async prismaTest() {
        await db.user.create({
          data: {
            discordId: "123",
            username: "test",
            avatar: "test",
            guild: {
                create: {
                    guildId: "123",
                    name: "test",
                    icon: "test",
                },
            },
          }
        });
    }

  onCreate (options: any) {
    this.setState(new TriviaGameState());

    // player send answer
    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      let score = this.calculateScore(message.answer, this.correctAnswer);
      let accepted = this.correctAnswer === message.answer;
      player.score += score;
      player.accepted = accepted;
      player.answered = message.answer;

      const answerFeedback = new AnswerResponse();
      answerFeedback.answered = player.answered;
      answerFeedback.correct = this.correctAnswer;
      answerFeedback.score = score;
      answerFeedback.accepted = accepted;
      answerFeedback.rectTop = message.rectTop;
      answerFeedback.rectHeight = message.rectHeight;

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
        if (this.state.players.size < 2) {
            client.send(new ErrorResponse("Not enough players to start the game!"));
            return;
        }
        // TODO: generate question options using API GenAI
        this.startGame();
    });
    if (process.env.NODE_ENV !== "production") {
      // TODO: remove this
      this.onMessage("testStartGame", (client, message) => {
        this.startGame();
        this.prismaTest().then();
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
    player.id = client.auth?.id || null;
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || `Guest-${Math.floor(Math.random() * 100)}`;
    player.avatar = client.auth?.avatar || "https://robohash.org/" + player.username;
    player.isBestPlayer = false;
    player.accepted = null;
    player.answered = null;
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

  startGame() {
    this.totalTurns = 0;
    this.nextTurn();
    this.broadcast("next", {});
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
        this.broadcast("gameOver", {});
        return;
    }
    if (this.state.gameOver) {
        return;
    }
    this.state.currentAnswer = this.correctAnswer;
    this.nextTurn();
  }

  nextTurn() {
    this.state.gameStarted = true;
    this.state.gameOver = false;
    this.state.currentTimer = 30;
    this.timer = this.clock.setInterval(() => this.tickGameTimer(), 1000);
    // this.state.currentQuestionOptions = this.questionOptions[this.totalTurns];
    const q = new QuestionOptions();
    q.id = "1";
    q.question = "Qual a melhor linguagem de programação?";
    q.options = ["Java", "Python", "JavaScript", "C#"];
    this.state.currentQuestionOptions = q;
    this.broadcast("next", {});
  }
}
