import {Schema, MapSchema, ArraySchema, type} from "@colyseus/schema";
import {Player} from "./Player";
import {QuestionOptions} from "./QuestionOptions";
import {Prompt} from "./Prompt";

export class TriviaGameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") owner: string;
  @type("boolean") gameStarted = false;
  @type("boolean") gameEnded = false;
  @type("boolean") gameOver = false;
  @type("boolean") gameLobby = true;
  @type("number") currentTimer = 0;
  @type("number") timerClock = 0;
  @type("number") currentAnswer: number = null;
  @type("string") theme: string = null;
  @type(QuestionOptions) currentQuestionOptions: QuestionOptions;
  @type([Prompt]) prompts = new ArraySchema<Prompt>();
}
