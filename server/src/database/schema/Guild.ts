import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const GuildSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
        default: () => uuid4(),
    },
    guildId: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.UUID,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: false,
    },
});

export const Guild = model('Guild', GuildSchema);