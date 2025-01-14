import {authenticate} from "../utils/Auth.ts";
import {useEffect} from "react";
import {useGame} from "./GameProvider.tsx";
import {discordSDK} from "../utils/DiscordSDK.ts";
import { useNavigate } from "react-router-dom";

import rocketIcon from "../assets/gifs/rocket.gif";
import logoDiscord from "../assets/images/discord-mark-white.svg";


export default function Auth() {

    const {tokenDiscord, setTokenDiscord} = useGame();
    const navigate = useNavigate();

    useEffect(() => {
        if (tokenDiscord) {
            navigate("/lobby/" + discordSDK.channelId);
            return;
        }
        authenticate().then((response) => {
            const token = response.token;
            console.log("Authenticated with Discord!");

            navigate("/lobby/" + discordSDK.channelId);
            setTokenDiscord(token);
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
