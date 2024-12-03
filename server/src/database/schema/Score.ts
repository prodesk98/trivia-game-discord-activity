import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const ScoreSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
        default: () => uuid4(),
    },
    userId: {
        type: Schema.Types.UUID,
        required: true,
    },
    roundId: {
        type: Schema.Types.UUID,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
});

export const Score = model("Score", ScoreSchema);