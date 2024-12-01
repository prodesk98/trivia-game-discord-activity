import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

import {JWT} from "@colyseus/auth";
import {Player} from "./schema/Player";
import {AnswerResponse} from "./schema/messages/AnswerResponse";
import {Delayed} from "colyseus";
import {QuestionOptions} from "./schema/QuestionOptions";
import {ErrorResponse} from "./schema/messages/ErrorResponse";


export class TriviaGameRoom extends Room<TriviaGameState> {
  maxClients = 5;
  totalTurns = 0;
  questionOptions: QuestionOptions[] = new Array<QuestionOptions>();
  currentQuestionIndex = 0;
  answerOptions: number[] = [];
  timer: Delayed;
  timeOut: Delayed;

  // TODO: uncomment this
  static onAuth (token: string) {
    return JWT.verify(token);
  }

  onCreate (options: any) {
    this.setState(new TriviaGameState());

    // player send answer
    this.onMessage("answer", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      // check if the player has already answered
      const correct = this.answerOptions[this.currentQuestionIndex];

      let score = this.calculateScore(message.answer, correct);
      let accepted = correct === message.answer;
      player.score += score;
      player.accepted = accepted;
      player.answered = message.answer;

      const answerFeedback = new AnswerResponse();
      answerFeedback.answered = player.answered;
      answerFeedback.correct = correct;
      answerFeedback.score = score;
      answerFeedback.accepted = accepted;
      answerFeedback.rectTop = message.rectTop;
      answerFeedback.rectHeight = message.rectHeight;

      // check if all players have answered
      let allAnswered = false;
      for (const [sessionId, player] of this.state.players) {
        if (player.answered === null) {
          continue;
        }
        allAnswered = true;
      }

      if (allAnswered) {
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
        this.startGame();
    });
    if (process.env.NODE_ENV !== "production") {
      // TODO: remove this
      this.onMessage("testStartGame", (client, message) => {
        this.startGame();
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
    player.sessionId = client.sessionId;
    player.username = client.auth?.username || `Guest-${Math.floor(Math.random() * 100)}`;
    player.avatar = client.auth?.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(Math.floor(Math.random() * 5).toString())}.png`;
    player.isBestPlayer = false;
    player.accepted = null;
    player.answered = null;
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

  startGame() {
    this.totalTurns = 0;

    // TODO: generate question options using API GenAI
    this.questionOptions = [
      new QuestionOptions(
          {
            id: "1",
            question: "Qual a melhor linguagem de programação?",
            options: ["Java", "Python", "JavaScript", "C#"],
            correct: 2
          }
      ),
      new QuestionOptions(
          {
            id: "2",
            question: "O que é um framework?",
            options: ["Um conjunto de códigos prontos",
            "Uma linguagem de programação",
            "Um banco de dados",
            "Um sistema operacional"],
            correct: 0
          }
      ),
      new QuestionOptions(
          {
            id: "3",
            question: "O que é uma API?",
            options: ["Um conjunto de códigos prontos", "Uma linguagem de programação", "Um banco de dados", "Um sistema operacional"],
            correct: 0
          }
      ),
      new QuestionOptions(
          {
            id: "4",
            question: "Qual destes é um sistema de controle de versão?",
            options: ["Docker", "Git", "Node.js", "Angular"],
            correct: 1
          }
      ),
      new QuestionOptions(
          {
            id: "5",
            question: "O que significa a sigla SQL?",
            options: ["Structured Query Language", "Simple Query Logic", "Software Query Language", "System Query Language"],
            correct: 0
          }
      ),
      new QuestionOptions(
          {
            id: "6",
            question: "Qual a principal diferença entre o HTTP e o HTTPS?",
            options: ["HTTPS é mais rápido", "HTTPS é seguro, usando criptografia", "HTTP funciona apenas em sites locais", "HTTPS é utilizado somente em redes privadas"],
            correct: 1
          }
      ),
      new QuestionOptions(
          {
            id: "7",
            question: "O que significa a sigla OOP, usada em programação?",
            options: ["Object Oriented Programming", "Open Online Platform", "Operational Overhead Processing", "Offshore Optimization Program"],
            correct: 0
          }
      ),
      new QuestionOptions(
          {
            id: "8",
            question: "O que é a programação assíncrona?",
            options: ["Execução de códigos de maneira sequencial", "Execução de códigos sem bloqueio de thread", "Execução de códigos em paralelo", "Execução de códigos com dependência de tempo"],
            correct: 1
          }
      ),
      new QuestionOptions(
          {
            id: "9",
            question: "Qual o conceito principal do 'Big O' na análise de algoritmos?",
            options: ["Avaliação de custo de energia", "Avaliação de tempo de execução e uso de memória", "Avaliação de usabilidade do software", "Avaliação de segurança do código"],
            correct: 1
          }
      ),
      new QuestionOptions(
          {
            id: "10",
            question: "Em qual estrutura de dados o acesso aos elementos é feito de forma Last In, First Out (LIFO)?",
            options: ["Fila", "Pilha", "Árvore", "Lista"],
            correct: 1
          }
      ),
    ]

    this.answerOptions = this.questionOptions.map(q => q.correct);

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
    this.totalTurns++;
    if (this.totalTurns > this.questionOptions.length) {
        this.state.gameOver = true;
        this.broadcast("gameOver", {});
        return;
    }
    if (this.state.gameOver) {
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
    this.state.gameOver = false;
    this.currentQuestionIndex = this.totalTurns;
    this.state.currentQuestionOptions = this.questionOptions[this.currentQuestionIndex];
    this.state.currentAnswer = this.answerOptions[this.currentQuestionIndex];

    // reset player answers
    for (const [sessionId, player] of this.state.players) {
      player.accepted = null;
      player.answered = null;
      this.state.players.set(sessionId, player);
    }

    // clear the timeout
    if(this.timeOut) this.timeOut.clear();

    // broadcast the next question
    this.broadcast("next", {i: this.currentQuestionIndex});

    // start the timer
    if (this.state.currentTimer < 30) this.state.currentTimer = 30;
    this.timer = this.clock.setInterval(() => this.tickGameTimer(), 1000);
  }
}
