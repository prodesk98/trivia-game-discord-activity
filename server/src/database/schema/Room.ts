import {model, Schema} from "mongoose";
import { v4 as uuid4 } from "uuid";


const RoomSchema = new Schema({
    id: {
        type: Schema.Types.UUID,
        required: true,
        unique: true,
        default: () => uuid4(),
    },
    roomId: {
        type: String,
        required: true,
    },
    guildId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    }
});

export const Room = model("Room", RoomSchema);