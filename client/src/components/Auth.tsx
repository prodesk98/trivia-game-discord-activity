import {authenticate} from "../utils/Auth.ts";
import {useEffect} from "react";
import { useNavigate } from "react-router-dom";

import rocketIcon from "../assets/gifs/rocket.gif";
import logoDiscord from "../assets/images/discord-mark-white.svg";
import {useGame} from "./GameProvider.tsx";
import {discordSDK} from "../utils/DiscordSDK.ts";
import {RPCCloseCodes} from "@discord/embedded-app-sdk";


export default function Auth() {

    const navigate = useNavigate();
    const { setTokenDiscord } = useGame();

    useEffect(() => {
        authenticate().then((response) => {
            const token = response.token;
            console.log("Authenticated with Discord!");

            if(discordSDK.guildId === null) {
                discordSDK.close(RPCCloseCodes.INVALID_ORIGIN, "Guild not found");
                return;
            }

            setTokenDiscord(token);
            navigate("/home");
        });
    }, []);

    return (
        <>
            <div>
                <div>
                    <img src={rocketIcon} alt={"Rocket"} width={"150px"} style={
                        {
                            display: "block",
                            marginLeft: "auto",
                            marginRight: "auto",
                            marginTop: "20vh",
                            marginBottom: "20vh",
                        }
                    }/>
                </div>
                <div style={
                    {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                        color: "white",
                        fontSize: "20px",
                        fontWeight: "bold",
                    }
                }>
                    <img src={logoDiscord} width={"20px"} alt={"Discord Logo"}/>
                    <p>Authenticating with Discord...</p>
                </div>
            </div>
        </>
    );
}
