import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const UserSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
        default: () => uuid4(),
    },
    discordId: {
        type: String,
        required: true,
        unique: true,
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
    isAnonymous: {
        type: Boolean,
        required: true,
        default: false,
    },
    language: {
        type: String,
        required: true,
        default: 'en',
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    }
});

export const User = model('User', UserSchema);