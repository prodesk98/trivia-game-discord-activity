import {Schema, MapSchema, type} from "@colyseus/schema";
import {Player} from "./Player";
import {QuestionOptions} from "./QuestionOptions";

export class TriviaGameState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") owner: string;
  @type("boolean") gameStarted = false;
  @type("boolean") gameOver = false;
  @type("number") currentTimer = 30;
  @type(QuestionOptions) currentQuestionOptions: QuestionOptions;

}
