import "../css/HomeGame.css";
import discordLogoWhite from "../assets/images/discord-mark-white.svg";
import {handleNotifyError} from "../core/Notification.ts";
import {discordSDK} from "../utils/DiscordSDK.ts";
import {RPCCloseCodes} from "@discord/embedded-app-sdk";

import PublicIcon from '@mui/icons-material/Public';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import {useNavigate} from "react-router-dom";

import axios from "axios";
import {useEffect, useState} from "react";
import {OrbitProgress} from "react-loading-indicators";
import i18n from "../utils/I18n.ts";

import LanguageSelect from "./fragments/LanguageSelect.tsx";
import {setLocalStorage} from "../utils/LocalStorage.ts";
import {useGame} from "./GameProvider.tsx";


export default function Home() {
    const navigate = useNavigate();
    const {language, setLanguage} = useGame();

    const [guildIcon, setGuildIcon] = useState<string>();

    const openOfficialDiscord = async () => {
        if (import.meta.env.VITE_DISCORD_INVITE_CODE === undefined) {
            handleNotifyError("Discord invite code not found!");
            return;
        }
        if (discordSDK === null) {
            handleNotifyError("Discord SDK not found!");
            return;
        }
        const urlInvite = `https://discord.gg/${import.meta.env.VITE_DISCORD_INVITE_CODE}`;
        await discordSDK.commands.openExternalLink({url: urlInvite});
    };

    const quit = async () => {
        discordSDK.close(RPCCloseCodes.CLOSE_NORMAL, 'User quit the game');
    }

    const redirectToRanking = () => {
        navigate("/ranking");
    }

    const getGuildIcon = async () => {
        try {
            const url = `${import.meta.env.VITE_NODE_ENV !== 'production' ? 'http://localhost:2567' : ''}/api/guild/${discordSDK.guildId}`;
            const guild = await axios.get(url);
            if (guild.status !== 200) {
                return `https://cdn.discordapp.com/embed/avatars/4.png`;
            }
            const icon = guild.data.icon;
            return `https://cdn.discordapp.com/icons/${discordSDK.guildId}/${icon}.webp?size=50`;
        } catch (error) {
            return `https://cdn.discordapp.com/embed/avatars/4.png`;
        }
    }

    useEffect(() => {
        getGuildIcon().then((icon) => {
            setGuildIcon(icon);
        });
    }, []);

    const startMatchingMaker = () => {
        navigate(`/lobby/${discordSDK.guildId}`);
    };

    const startGlobalMode = () => {
        navigate("/lobby/global");
    };

    const changeLanguage = async (lng: string) => {
        await i18n.changeLanguage(lng, () => {
            console.log("Language changed to: ", lng);
        });
    };

    const handleLanguageChange = (l: any) => {
        setLanguage(l);
        changeLanguage(l).then();
        setLocalStorage("language", l);
    }

    return (
        <>
        <div className="menu-container">
            <div className="title">
                <div>
                    <img src={'/src/assets/images/logo.png'} alt={'Logo'} width={'150px'}/>
                </div>
                <div>
                    <small>By <b>Protons</b></small>
                </div>
            </div>
            <div className="buttons">
                <div className="button" onClick={startMatchingMaker}>
                    <div>
                        {guildIcon !== undefined ? (
                            <img src={guildIcon} alt={'Logo'}
                                 width={'50px'}/>
                        ) : (
                            <OrbitProgress variant="split-disc" color="#FFF"
                                           size="small" text=""
                                           textColor=""
                                           style={{fontSize: "10px"}}/>
                        )
                        }
                    </div>
                    <div className={"lb-text"}>
                        {i18n.t('Play on Server')}
                    </div>
                </div>
                <div className="button" onClick={startGlobalMode}>
                    <div>
                        <PublicIcon/>
                    </div>
                    <div className={"lb-text"}>
                        {i18n.t('Play Globally')}
                    </div>
                </div>
                <div className="button" onClick={redirectToRanking}>
                    <div>
                        <EmojiEventsIcon/>
                    </div>
                    <div className={"lb-text"}>
                        {i18n.t('Ranking')}
                    </div>
                </div>
                <div className="button" onClick={quit}>
                    <div>
                        <ExitToAppIcon />
                    </div>
                    <div className={"lb-text"}>
                        {i18n.t('Quit')}
                    </div>
                </div>
            </div>
            <div className="socials">
                <a href={"#"} onClick={(e) => {
                    e.preventDefault();
                    openOfficialDiscord().then();
                }}>
                    <img src={discordLogoWhite} alt={'Discord Logo'} className={'logo'} width={'35px'}/>
                </a>
            </div>
            <p className="version">v.0.101</p>
        </div>
        <div className="top-right-buttons">
            <LanguageSelect selectedLanguage={language} handleLanguageChange={handleLanguageChange}/>
        </div>
    </>
)
}
