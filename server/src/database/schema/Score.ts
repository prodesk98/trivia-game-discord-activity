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
        ref: "User",
        required: true,
    },
    roundId: {
        type: Schema.Types.UUID,
        required: true,
    },
    roomId: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    }
});

export const Score = model("Score", ScoreSchema);