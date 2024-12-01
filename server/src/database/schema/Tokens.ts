import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const TokensSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
        default: () => uuid4(),
    },
    userId: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
    },
    accessToken: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        expires: 3600,
        default: Date.now,
        required: true,
    },
});

export const Tokens = model('Tokens', TokensSchema);