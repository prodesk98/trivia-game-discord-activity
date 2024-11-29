import mongoose from 'mongoose';
import { UserSchema } from '../schema/User';
import { RoomSchema } from '../schema/Room';
import { ScoreSchema } from "../schema/Score";


mongoose.connect(process.env.MONGO_URI).then(() => console.log("💾  Connected to MongoDB!"));

/*
* User
*/
export const getUserById = async (id: string) => {
    return mongoose.model('User', UserSchema).findOne(
        {
            id: new mongoose.Types.UUID(id),
        }
    );
}

export const getUserByDiscordId = async (discordId: string) => {
    return mongoose.model('User', UserSchema).findOne(
        {
            discordId: discordId,
        }
    );
}

export const createUser = async (id: string, discordId: string, guildId: string, username: string, avatar?: string) => {
    return await mongoose.model('User', UserSchema).create({
        id: id,
        discordId: discordId,
        guildId: guildId,
        username: username,
        avatar: avatar,
    });
}

/*
* Room
*/

export const getRoomById = async (id: string) => {
    return mongoose.model('Room', RoomSchema).findOne(
        {
            id: new mongoose.Types.UUID(id),
        }
    );
}

export const createRoom = async (id: string, guildId: string) => {
    return mongoose.model('Room', RoomSchema).create({
        id: id,
        guildId: guildId,
    });
}


export const updateRoom = async (id: string, guildId: string) => {
    return mongoose.model('Room', RoomSchema).updateOne(
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

export const createScore = async (id: string, userId: string, value: number) => {
    return await mongoose.model('Score', ScoreSchema).create({
        id: id,
        userId: userId,
        value: value,
    });
}

export const getSumScoreByUserId = async (userId: string): Promise<Number> => {
    const result = await mongoose.model('Score', ScoreSchema).aggregate(
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
