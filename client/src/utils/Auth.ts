import {DISCORD_CLIENT_ID, discordSDK} from "./DiscordSDK.ts";
import {colyseusSDK} from "./Colyseus.ts";


export async function authenticate() {
    console.log(`mode authenticated: ${import.meta.env.VITE_NODE_ENV}`);
    if (import.meta.env.VITE_NODE_ENV !== "production") {
        console.log("Development mode");
        return {
            access_token: "mock",
            user: {
                username: "mock",
                discriminator: "mock",
                id: "mock",
                avatar: null,
                public_flags: 1,
            },
            scopes: [],
            expires: new Date(2112, 1, 1).toString(),
            application: {
                description: "mock",
                icon: "mock",
                id: "mock",
                name: "mock",
            },
        };
    }

    await discordSDK.ready();

    const { code } = await discordSDK.commands.authorize({
        client_id: DISCORD_CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: [
            'identify',
            'guilds',
            'guilds.members.read',
            'rpc.voice.read',
        ]
    });

    const { data } = await colyseusSDK.http.post("/discord/token", {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });

    if (!data.access_token) {
        throw new Error("Failed to authenticate with Discord.");
    }

    await discordSDK.commands.authenticate({ access_token: data.access_token });

    return data;
}