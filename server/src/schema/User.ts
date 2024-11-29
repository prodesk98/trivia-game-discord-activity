import { Schema } from "mongoose";

export const UserSchema = new Schema({
    id: Schema.Types.UUID,
    discordId: String,
    guildId: String,
    username: String,
    avatar: String,
});