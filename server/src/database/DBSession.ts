import mongoose from 'mongoose';
import { User } from './schema/User';
import { Room } from './schema/Room';
import { Score } from "./schema/Score";
import {Guild} from "./schema/Guild";
import {Tokens} from "./schema/Tokens";


mongoose.connect(process.env.MONGO_URI).then(() => console.log("💾  Connected to MongoDB!"));

/*
* User
*/
export const getUserById = async (id: string) => {
    return User.findOne(
        {
            id: new mongoose.Types.UUID(id),
        }
    );
}

export const getUserByDiscordId = async (discordId: string) => {
    return User.findOne(
        {
            discordId: discordId,
        }
    );
}

export const existsUser = async (discordId: string) => {
    return User.exists(
        {
            discordId: discordId,
        }
    );
}

export const createUser = async (discordId: string, username: string, avatar?: string): Promise<mongoose.Types.UUID> => {
    const user = new User();
    user.discordId = discordId;
    user.username = username;
    user.avatar = avatar;
    await user.save();
    return user.id;
}

/*
* Room
*/

export const getRoomById = async (id: string) => {
    return Room.findOne(
        {
            id: new mongoose.Types.UUID(id),
        }
    );
}

export const createRoom = async (guildId: string, roomId: string): Promise<mongoose.Types.UUID> => {
    const room = new Room();
    room.guildId = guildId;
    room.roomId = roomId;
    await room.save();
    return room.id;
}


export const updateRoom = async (id: string, guildId: string) => {
    return Room.updateOne(
        {
            id: new mongoose.Types.UUID(id),
        },
        {
            guildId: guildId,
        }
    );
}

/*
* Score
*/

export const createScore = async (userId: string, roundId: string, roomId: string, value: number) => {
    const score = new Score();
    // @ts-ignore
    score.userId = new mongoose.Types.UUID(userId);
    // @ts-ignore
    score.roundId = new mongoose.Types.UUID(roundId);
    score.roomId = roomId;
    score.value = value;
    await score.save();
    return score.id;
}

export const getSumScoreByUserId = async (userId: string): Promise<Number> => {
    const result = await Score.aggregate(
        [
            {
                $match: { userId: new mongoose.Types.UUID(userId) }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$value" }
                }
            }
        ]
    );
    return result.length > 0 ? result[0].total : 0;
}


export const getSumScoreByUserIdAndRoundId = async (userId: string, roundId: string): Promise<Number> => {
    const result = await Score.aggregate(
        [
            {
                $match: { userId: new mongoose.Types.UUID(userId), roundId: new mongoose.Types.UUID(roundId) }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$value" }
                }
            }
        ]
    );
    return result.length > 0 ? result[0].total : 0;
}


export const getSumScoreByRoomIdAndUserId = async (userId: string, roomId: string): Promise<Number> => {
    const result = await Score.aggregate(
        [
            {
                $match: {
                    userId: new mongoose.Types.UUID(userId),
                    roomId: roomId
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$value" }
                }
            }
        ]
    );
    return result.length > 0 ? result[0].total : 0;
}

/*
* Guild
*/

export const getGuildById = async (id: string) => {
    return Guild.findOne(
        {
            id: new mongoose.Types.UUID(id),
        }
    );
}


export const getAllGuildsByUserId = async (userId: string) => {
    return Guild.find(
        {
            userId: new mongoose.Types.UUID(userId),
        }
    );
}

export const existsGuild = async (guildId: string, userId?: string) => {
    return Guild.exists(
        {
            guildId: guildId,
            userId: userId ? new mongoose.Types.UUID(userId) : { $exists: true },
        }
    );
}


export const createGuild = async (discordId: string, userId: string, name: string, icon?: string): Promise<mongoose.Types.UUID> => {
    const guild = new Guild();
    guild.guildId = discordId;
    // @ts-ignore
    guild.userId = new mongoose.Types.UUID(userId);
    guild.name = name;
    guild.icon = icon;
    await guild.save();
    return guild.id;
}


/*
* Tokens
*/

export const getTokensByUserId = async (userId: string) => {
    return Tokens.findOne(
        {
            userId: userId,
        }
    );
}


export const upsertTokens = async (userId: string, accessToken: string, refreshToken: string) => {
    return Tokens.updateOne(
        {
            userId: new mongoose.Types.UUID(userId),
        },
        {
            accessToken: accessToken,
            refreshToken: refreshToken,
        },
        {
            upsert: true,
        }
    );
}
