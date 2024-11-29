import mongoose from 'mongoose';
import { User } from './schema/User';
import { Room } from './schema/Room';
import { Score } from "./schema/Score";


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

export const createUser = async (discordId: string, guildId: string, username: string, avatar?: string): Promise<mongoose.Types.UUID> => {
    const user = new User();
    user.discordId = discordId;
    user.guildId = guildId;
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

export const createRoom = async (guildId: string): Promise<mongoose.Types.UUID> => {
    const room = new Room();
    room.guildId = guildId;
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

export const createScore = async (userId: string, value: number) => {
    const score = new Score();
    // @ts-ignore
    score.userId = new mongoose.Types.UUID(userId);
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
