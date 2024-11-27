import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

import { WebSocketTransport } from "@colyseus/ws-transport"

import { JWT } from "@colyseus/auth";

/**
 * Import your Room files
 */
import { TriviaGameRoom } from "./rooms/TriviaGameRoom";

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
        gameServer.define('trivia1', TriviaGameRoom)
            .filterBy(['channelId']);

    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Discord Embedded SDK: Retrieve user token when under Discord/Embed
         */
        app.post("/token/discord", async (req, res) => {
            //
            // TODO: remove this on production
            //
            if (req.body.code === "mock_code") {
                const user = {
                    id: Math.random().toString(36).slice(2, 10),
                    username: `User ${Math.random().toString().slice(2, 10)}`,
                }
                res.send({ access_token: "mocked", token: await JWT.sign(user), user });
                return;
            }

            try {
                const response = await fetch('https://discord.com/api/oauth2/token', {
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

                const { access_token } = await response.json();

                const profile = await (await fetch('https://discord.com/api/users/@me', {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${access_token}`,
                    },
                })).json();

                // TODO: save user profile on your database

                const user = {
                    id: profile.id,
                    username: profile.username,
                }

                res.send({ access_token, token: await JWT.sign(user), user });
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
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
