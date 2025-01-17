import "../css/HomeGame.css";
import discordLogoWhite from "../assets/images/discord-mark-white.svg";
import logo from "../assets/images/logo.png";
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
import {getLocalStorage, hasLocalStorage, setLocalStorage} from "../utils/LocalStorage.ts";
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
            const guildId = discordSDK.guildId;
            if (guildId === null) return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
            const url = `${import.meta.env.VITE_NODE_ENV !== 'production' ? 'http://localhost:2567' : '/.proxy'}/api/guild/${guildId}`;
            const guild = await axios.get(url);
            if (guild.status !== 200) {
                return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
            }
            const icon = guild.data.icon;
            return `https://cdn.discordapp.com/icons/${guildId}/${icon}.webp`;
        } catch (error) {
            return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
        }
    }

    useEffect(() => {
        getGuildIcon().then((icon) => {
            setGuildIcon(icon);
        });
        // Set language
        discordSDK.commands.userSettingsGetLocale().then((resp) => {
            let language = resp.locale.includes("-") ? resp.locale.split("-")[0] : resp.locale;
            if (!hasLocalStorage("language")) {
                setLocalStorage("language", language);
            }
            changeLanguage(l).then();
            setLanguage(getLocalStorage("language"));
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
                    <img src={logo} alt={'Logo'} width={'150px'}/>
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
                                 width={'50px'}
                                 onError={(e: any) => {
                                     e.target.onerror = null;
                                     e.target.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
                                 }}/>
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
