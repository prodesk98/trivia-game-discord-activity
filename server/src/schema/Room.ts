import { Schema } from "mongoose";

export const RoomSchema = new Schema({
    id: Schema.Types.UUID,
    guildId: String,
});