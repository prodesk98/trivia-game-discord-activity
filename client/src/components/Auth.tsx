import {authenticate} from "../utils/Auth.ts";
import {useEffect} from "react";
import {useGame} from "./GameProvider.tsx";
import {discordSDK} from "../utils/DiscordSDK.ts";
import { useNavigate } from "react-router-dom";

export default function Auth() {

    const {setTokenDiscord} = useGame();
    const navigate = useNavigate();

    useEffect(() => {
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
                    <img src={"/src/assets/gifs/rocket.gif"} alt={"Rocket"} width={"150px"} style={
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
                    <img src={"/src/assets/images/discord-mark-white.svg"} width={"20px"} alt={"Discord Logo"}/>
                    <p>Authenticating with Discord...</p>
                </div>
            </div>
        </>
    );
}
