import { Schema, MapSchema, type } from "@colyseus/schema";
import {Player} from "./Player";

export class GameState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();
  @type("number") currentQuestion = 0;
  @type("number") currentTimer = 30;

  getCorrectAnswer() {
    return 1; // TODO: query the database for the correct answer
  }

  calculateScore(response: number, correct: number) {
    return (correct === response ? 1 : 0) * this.currentTimer;
  }

}
