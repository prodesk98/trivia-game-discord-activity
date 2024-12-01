import {Room, Client} from "@colyseus/core";
import {TriviaGameState} from "./schema/TriviaGameState";

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

      if (accepted) createScore(player.userId, score).then();

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

  startGame() {
    this.totalTurns = 0;

    // TODO: generate question options using API GenAI
    this.questionOptions = [
        new QuestionOptions(
            {
                id: "1",
                question: "Qual é a capital da França?",
                options: ["Berlim", "Madrid", "Paris", "Roma"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "2",
                question: "Quem pintou a Mona Lisa?",
                options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "3",
                question: "Qual é o maior oceano do mundo?",
                options: ["Oceano Atlântico", "Oceano Índico", "Oceano Ártico", "Oceano Pacífico"],
                correct: 3
            }
        ),
        new QuestionOptions(
            {
                id: "4",
                question: "Quem foi o primeiro presidente dos Estados Unidos?",
                options: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "5",
                question: "Em que ano o homem pisou na Lua pela primeira vez?",
                options: ["1965", "1969", "1972", "1975"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "6",
                question: "Qual é o símbolo químico da água?",
                options: ["O2", "H2O", "CO2", "H2SO4"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "7",
                question: "Quem escreveu 'Dom Quixote'?",
                options: ["Miguel de Cervantes", "William Shakespeare", "Gabriel García Márquez", "Jorge Luis Borges"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "8",
                question: "Qual é o continente mais populoso?",
                options: ["África", "Ásia", "Europa", "América"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "9",
                question: "Quem pintou o teto da Capela Sistina?",
                options: ["Raphael", "Michelangelo", "Leonardo da Vinci", "Caravaggio"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "10",
                question: "Qual é a moeda oficial do Japão?",
                options: ["Yuan", "Won", "Dólar", "Iene"],
                correct: 3
            }
        ),
        new QuestionOptions(
            {
                id: "11",
                question: "Qual é o nome do maior planeta do sistema solar?",
                options: ["Terra", "Saturno", "Júpiter", "Marte"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "12",
                question: "Qual é a língua oficial do Brasil?",
                options: ["Espanhol", "Inglês", "Francês", "Português"],
                correct: 3
            }
        ),
        new QuestionOptions(
            {
                id: "13",
                question: "Qual o maior país do mundo em área?",
                options: ["China", "Estados Unidos", "Rússia", "Canadá"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "14",
                question: "Quem foi o autor de 'O Senhor dos Anéis'?",
                options: ["J.R.R. Tolkien", "George R. R. Martin", "C.S. Lewis", "J.K. Rowling"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "15",
                question: "Em que país as pirâmides de Gizé estão localizadas?",
                options: ["Egito", "México", "Peru", "Irã"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "16",
                question: "Qual é o animal terrestre mais rápido?",
                options: ["Leão", "Tigre", "Chita", "Guepardo"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "17",
                question: "Qual é o nome do maior deserto do mundo?",
                options: ["Deserto do Saara", "Deserto de Gobi", "Antártida", "Deserto de Kalahari"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "18",
                question: "Quem descobriu a teoria da relatividade?",
                options: ["Isaac Newton", "Nikola Tesla", "Albert Einstein", "Galileu Galilei"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "19",
                question: "Qual é a capital da Austrália?",
                options: ["Sydney", "Melbourne", "Canberra", "Perth"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "20",
                question: "Qual é a maior cidade do mundo em termos de população?",
                options: ["Tóquio", "Pequim", "Cidade do México", "Mumbai"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "21",
                question: "Qual é o nome do exoplaneta mais próximo da Terra?",
                options: ["Proxima Centauri b", "Kepler-452b", "HD 209458 b", "Gliese 581g"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "22",
                question: "Quem fundou a Apple?",
                options: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Elon Musk"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "23",
                question: "Qual é o nome da primeira mulher a ir ao espaço?",
                options: ["Valentina Tereshkova", "Sally Ride", "Mae Jemison", "Yuri Gagarin"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "24",
                question: "Qual é a montanha mais alta do mundo?",
                options: ["K2", "Kangchenjunga", "Everest", "Makalu"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "25",
                question: "Quem é o Deus do trovão na mitologia nórdica?",
                options: ["Odin", "Thor", "Loki", "Freya"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "26",
                question: "Qual é o país com maior população do mundo?",
                options: ["Índia", "China", "Estados Unidos", "Rússia"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "27",
                question: "Qual o nome do primeiro filme de Star Wars?",
                options: ["O Império Contra-Ataca", "Uma Nova Esperança", "O Retorno de Jedi", "A Vingança dos Sith"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "28",
                question: "Qual é o maior rio do mundo?",
                options: ["Amazonas", "Nilo", "Yangtsé", "Mississippi"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "29",
                question: "Em que continente está o deserto do Saara?",
                options: ["África", "Ásia", "América do Norte", "Europa"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "30",
                question: "Qual é a cor do coração de um polvo?",
                options: ["Vermelho", "Azul", "Verde", "Amarelo"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "31",
                question: "Qual é o símbolo químico do oxigênio?",
                options: ["O", "O2", "OX", "O3"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "32",
                question: "Qual é o nome da primeira mulher presidente do Brasil?",
                options: ["Dilma Rousseff", "Marina Silva", "Luiza Erundina", "Janaína Paschoal"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "33",
                question: "Qual é o nome do satélite natural da Terra?",
                options: ["Luna", "Moon", "Saturno", "Galileu"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "34",
                question: "Qual é a capital da Itália?",
                options: ["Roma", "Milão", "Florença", "Nápoles"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "35",
                question: "Qual é o maior animal do planeta?",
                options: ["Elefante", "Baleia Azul", "Girafa", "Tubarão Branco"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "36",
                question: "Qual é o país mais frio do mundo?",
                options: ["Rússia", "Antártida", "Canadá", "Finlândia"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "37",
                question: "Em que ano começou a Primeira Guerra Mundial?",
                options: ["1910", "1912", "1914", "1916"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "38",
                question: "Quem foi o primeiro imperador da China?",
                options: ["Qin Shi Huang", "Liu Bang", "Tang Taizong", "Wudi"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "39",
                question: "Qual é o nome do maior lago do mundo?",
                options: ["Lago Vitória", "Lago Baikal", "Mar Cáspio", "Lago de Genebra"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "40",
                question: "Qual o animal símbolo da Austrália?",
                options: ["Canguru", "Coala", "Wombat", "Emu"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "41",
                question: "Quem é o criador do universo Marvel?",
                options: ["Steve Jobs", "Jack Kirby", "Stan Lee", "Chris Hemsworth"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "42",
                question: "Qual é a montanha mais alta do Brasil?",
                options: ["Pico da Neblina", "Pico do Bandeira", "Pico das Agulhas Negras", "Pico da Vitória"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "43",
                question: "Qual é o nome da maior floresta tropical do mundo?",
                options: ["Floresta Amazônica", "Floresta do Congo", "Floresta de Borneo", "Floresta de Taiga"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "44",
                question: "Quem foi o primeiro homem a caminhar na Lua?",
                options: ["Buzz Aldrin", "Neil Armstrong", "Michael Collins", "Yuri Gagarin"],
                correct: 1
            }
        ),
        new QuestionOptions(
            {
                id: "45",
                question: "Qual é a principal língua falada no México?",
                options: ["Espanhol", "Inglês", "Francês", "Portugues"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "46",
                question: "Em que ano terminou a Segunda Guerra Mundial?",
                options: ["1940", "1942", "1945", "1947"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "47",
                question: "Qual é o maior estado do Brasil em termos de área?",
                options: ["Minas Gerais", "São Paulo", "Amazonas", "Bahia"],
                correct: 2
            }
        ),
        new QuestionOptions(
            {
                id: "48",
                question: "Qual o nome do fundador do Facebook?",
                options: ["Steve Jobs", "Elon Musk", "Bill Gates", "Mark Zuckerberg"],
                correct: 3
            }
        ),
        new QuestionOptions(
            {
                id: "49",
                question: "Qual é a maior religião do mundo?",
                options: ["Cristianismo", "Islamismo", "Hinduísmo", "Budismo"],
                correct: 0
            }
        ),
        new QuestionOptions(
            {
                id: "50",
                question: "Em que ano a primeira invenção do automóvel foi feita?",
                options: ["1875", "1885", "1900", "1920"],
                correct: 1
            }
        )
    ]

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
