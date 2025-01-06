import {Schema, MapSchema, type} from "@colyseus/schema";
import {Player} from "./Player";
import {QuestionOptions} from "./QuestionOptions";

export class TriviaGameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") owner: string;
  @type("boolean") gameStarted = false;
  @type("boolean") gameEnded = false;
  @type("boolean") gameOver = false;
  @type("boolean") gameLobby = true;
  @type("number") currentTimer = 0;
  @type("number") timerClock = 0;
  @type("number") currentAnswer: number = -1;
  @type("string") theme: string = null;
  @type("boolean") awaitingGeneration = false;
  @type(["string"]) categories: string[] = [];
  @type(QuestionOptions) currentQuestionOptions: QuestionOptions;
  // translations
  @type({ map: "string" }) translations = new MapSchema<string, string>();
}
