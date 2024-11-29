import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const UserSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        default: () => uuid4(),
    },
    discordId: {
        type: String,
        required: true,
        unique: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: false,
        default: () => {
            return `https://cdn.discordapp.com/embed/avatars/${parseInt(Math.floor(Math.random() * 5).toString())}.png`;
        },
    },
});

export const User = model('User', UserSchema);