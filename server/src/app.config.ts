import config from "@colyseus/tools";
import { playground } from "@colyseus/playground";

import { WebSocketTransport } from "@colyseus/ws-transport"

import { JWT } from "@colyseus/auth";

/**
 * Import your Room files
 */
import { TriviaGameRoom } from "./rooms/TriviaGameRoom";
import {
    createGuild, createUser, existsGuild,
    existsUser, getUserByDiscordId, upsertTokens,
    getRanking, getBuildByGuidId
} from "./database/DBSession";

export default config({

    initializeTransport: function(opts) {
        return new WebSocketTransport({
            ...opts,
            pingInterval: 6000,
            pingMaxRetries: 4,
            maxPayload: 1024 * 1024, // 1MB Max Payload
        });
    },

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('lobby', TriviaGameRoom)
            .filterBy(['lobbyId']);

    },

    initializeExpress: (app) => {

        /**
         * Guild
         */
        app.get("/api/guild/:guildId", async (req, res) => {
            try {
                const guildId = req.params.guildId;
                const guild = await getBuildByGuidId(guildId);

                if (!guild) {
                    return res.status(404).json({ error: 'Guild not found' });
                }
                res.json(guild);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        app.get("/api/ranking", async (req, res) => {
            try {
                const ranking = await getRanking();
                res.json(ranking);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        /**
         * Discord Embedded SDK: Retrieve user token when under Discord/Embed
         */
        app.post("/colyseus/discord/token", async (req, res) => {
            try {
                const response: any = await fetch('https://discord.com/api/oauth2/token', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: process.env.DISCORD_CLIENT_ID,
                        client_secret: process.env.DISCORD_CLIENT_SECRET,
                        grant_type: 'authorization_code',
                        code: req.body.code,
                    }),
                });

                const { access_token, refresh_token } = await response.json();

                if (typeof access_token === 'undefined') {
                    return res.status(400).send({ error: "Invalid code" });
                }

                const discordProfile: any = await (await fetch('https://discord.com/api/users/@me', {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${access_token}`,
                    },
                })).json();

                if (typeof discordProfile.id === 'undefined') {
                    return res.status(400).send({ error: "Invalid profile" });
                }

                // create user if not exists
                const userExists = await existsUser(discordProfile.id);

                if (!userExists) await createUser(
                    discordProfile.id,
                    discordProfile.username,
                    discordProfile.avatar,
                    discordProfile.locale.includes("-") ? discordProfile.locale.split("-")[0] : discordProfile.locale,
                );

                const userStorage = await getUserByDiscordId(discordProfile.id);

                if (userStorage == null) {
                    return res.status(400).send({ error: "Invalid user" });
                }

                // parse userId(uuid) to string
                const userIdString: string = userStorage.id.toString();

                // upsert tokens
                upsertTokens(userIdString, access_token, refresh_token).then();

                // get all guilds
                const guilds: any = await (await fetch('https://discord.com/api/users/@me/guilds', {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${access_token}`,
                    },
                })).json();

                async function _createGuild(id: string, userId: string, name: string, icon: string) {
                    if(await existsGuild(id, userId)) await createGuild(id, userId, name, icon);
                }

                const tasks = guilds.map((guild: any) => _createGuild(guild.id, userIdString, guild.name, guild.icon));
                await Promise.all(tasks);

                // get current guildId using referrer
                const guildId = req.headers.referer?.split("&").find((x: string) => x.includes("guild_id"))?.split("=")[1];

                const payload = {
                    userId: userIdString,
                    guildId: guildId,
                    discordId: userStorage.discordId,
                    avatar: userStorage.avatar,
                    username: userStorage.username,
                    language: userStorage.language.includes("-") ? userStorage.language.split("-")[0] : userStorage.language,
                    isAnonymous: userStorage.isAnonymous,
                }

                res.send({ access_token, token: await JWT.sign(payload), payload });
            } catch (e: any) {
                res.status(400).send({ error: e.message })
            }
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground);
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
