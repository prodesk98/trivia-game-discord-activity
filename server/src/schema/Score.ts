import { Schema } from "mongoose";

export const ScoreSchema = new Schema({
    id: Schema.Types.UUID,
    userId: Schema.Types.UUID,
    value: Number,
});