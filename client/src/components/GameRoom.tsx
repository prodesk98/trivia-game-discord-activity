// icons
import MusicOffIcon from '@mui/icons-material/MusicOff';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CloseIcon from '@mui/icons-material/Close';
import ClockIcon from '@mui/icons-material/QueryBuilder';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SendIcon from '@mui/icons-material/Send';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ChatIcon from '@mui/icons-material/Chat';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// css
import "../css/GameRoom.css";

import 'react-toastify/dist/ReactToastify.css';

import {OrbitProgress, Riple} from "react-loading-indicators";

// notifications
import {handleNotifyError, handleNotifyGameStatus} from "../core/Notification.ts";

import {PlayerList} from "./fragments/PlayerList.tsx";
import {Leaderboard} from "./fragments/Leaderboard.tsx";
import {OptionsGame} from "./fragments/OptionsGame.tsx";
import {useEffect, useRef, useState} from "react";

import notificationSound from "../assets/sounds/notification.ogg";
import correctSound from "../assets/sounds/correct-answer.ogg";
import incorrectSound from "../assets/sounds/incorrect-answer.ogg";

import discordLogoWhite from "../assets/images/discord-mark-white.svg";

import {colyseusSDK} from "../utils/Colyseus.ts";
import {discordSDK} from "../utils/DiscordSDK.ts";
import {Player} from "../schema/Player.ts";
import {handleCalculatePosition} from "../core/Logic.ts";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {AnswerResponse} from "../schema/AnswerResponse.ts";
import {getLocalStorage, hasLocalStorage, setLocalStorage} from "../utils/LocalStorage.ts";
import {handleConfetti} from "../core/Effect.ts";
import {RankingDialog} from "./fragments/RankingDialog.tsx";

import i18n from "../utils/I18n.ts";
import LanguageSelect from "./fragments/LanguageSelect.tsx";
import {useGame} from "./GameProvider.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {authenticate} from "../utils/Auth.ts";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";


export default function GameRoom(){
    const totalTime = 15; // Tempo total da pergunta

    const [isDialogPlayGame, setIsDialogPlayGame] = useState(false);
    const [isDialogHome, setIsDialogHome] = useState(false);
    const [isDialogRanking, setIsDialogRanking] = useState(false);
    const [chatMessages, setChatMessages] = useState<string[]>([]);
    const [isChatVisible, setChatIsVisible] = useState(false);

    const navigate = useNavigate();
    const { lobbyId } = useParams();

    const {
        isMuted, setIsMuted, playAudio,
        toggleAudio, setLanguage,
        language, room, setRoom, ownerProfile, setOwnerProfile,
        profile, setProfile, theme, setTheme, players, setPlayers,
        currentQuestionOptions, setCurrentQuestionOptions,
        timeLeft, setTimeLeft, timerClock, setTimerClock,
        gameStarted, setGameStarted, gameEnded, setGameEnded,
        gameLobby, setGameLobby, gamePaused, setGamePaused,
        answerSelected, setAnswerSelected, answerCorrect, setAnswerCorrect,
        awaitingGeneration, setAwaitingGeneration, translations, setTranslations,
        categories, setCategories, owner, setOwner, tokenDiscord, setTokenDiscord
    } = useGame();

    const changeLanguage = async (lng: string) => {
        await i18n.changeLanguage(lng, () => {
            console.log("Language changed to: ", lng);
            if (typeof room !== 'undefined') room.send("changeLanguage", {language: lng});
        });
    };

    // correct sound effect
    const correctSoundEffect = useRef<HTMLAudioElement|null>(null);

    // alert sound effect
    const notificationSoundEffect = useRef<HTMLAudioElement|null>(null);

    // incorrect sound effect
    const incorrectSoundEffect = useRef<HTMLAudioElement|null>(null);


    const playSoundCorrect = () => {
        if (isMuted) return;
        if (correctSoundEffect.current === null) {
            correctSoundEffect.current = new Audio(correctSound);
            correctSoundEffect.current.volume = 0.2;
        }
        correctSoundEffect.current.play().then(() => console.log("Correct answer!"));
    }

    const playSoundIncorrect = () => {
        if (isMuted) return;
        if (incorrectSoundEffect.current === null) {
            incorrectSoundEffect.current = new Audio(incorrectSound);
            incorrectSoundEffect.current.volume = 0.3;
        }
        incorrectSoundEffect.current.play().then(() => console.log("Incorrect answer!"));
    }

    const playSoundNotification = () => {
        if (isMuted) return;
        if (notificationSoundEffect.current === null) {
            notificationSoundEffect.current = new Audio(notificationSound);
            notificationSoundEffect.current.volume = 0.3;
        }
        notificationSoundEffect.current.play().then(() => console.log("Notification!"));
    }

    const handleToggleSound = () => {
        const toggle = !isMuted;
        setIsMuted(toggle);
        setLocalStorage("isMuted", toggle);

        toggleAudio();
    };

    // Discord Embedded SDK: Retrieve user token when under Discord/Embed
    useEffect(() => {
        try {
            console.log("Authenticating with Discord...");
            if (typeof tokenDiscord === 'undefined') {
                authenticate().then((response) => {
                    const token = response.token;
                    console.log("Authenticated with Discord!");

                    setTokenDiscord(token);
                    handleColyseusConnection(token, typeof lobbyId !== 'undefined' ? lobbyId : "default").then();
                });
                return;
            }
            handleColyseusConnection(tokenDiscord, typeof lobbyId !== 'undefined' ? lobbyId : "default").then();
        }catch (e) {
            console.error(e);
            handleNotifyError(`Failed to authenticate with Discord. ${e}`);
        }
    }, []);

    // select language
    useEffect(() => {changeLanguage(language).then()}, [language]);

    // sendMessage
    const handleSendMessage = (message: string, data: any = {}) => {
        if (typeof room === 'undefined') {
            handleNotifyError("Room undefined!");
            return;
        }
        room.send(message, data);
    }

    const handlePlayGameRandom = () => {
        if (ownerProfile && profile && ownerProfile.sessionId !== profile.sessionId) {
            handleNotifyError("You are not the owner of the room!");
            setIsDialogPlayGame(false);
            return;
        }
        const category = document.getElementById('category') as HTMLInputElement;
        if (category === null) {
            handleNotifyError("Please select a category!");
            setIsDialogPlayGame(false);
            return;
        }
        let value = category?.value;
        if (value === "") {
            handleNotifyError("Please select a category!");
            setIsDialogPlayGame(false);
            return
        }
        handleSendMessage("startGame", {prompt: 'random', category: value, language: language});
        setIsDialogPlayGame(false);
    }

    // play game
    const handlePlayGame = () => {
        if (ownerProfile && profile && ownerProfile.sessionId !== profile.sessionId) {
            handleNotifyError("You are not the owner of the room!");
            setIsDialogPlayGame(false);
            return;
        }
        if (theme !== null) {
            handleNotifyError("Theme already chosen!");
            setIsDialogPlayGame(false);
            return;
        }
        const prompt = document.querySelector('.dialog-textarea');
        if (prompt === null) {
            handleNotifyError("Please enter a prompt!");
            return;
        }
        // @ts-ignore
        if (prompt?.value === "") {
            handleNotifyError("Please enter a prompt!");
            return;
        }
        // @ts-ignore
        handleSendMessage("startGame", {prompt: prompt?.value, category: null, language: language});
        setIsDialogPlayGame(false);
    }

    const handleColyseusConnection = async (token: string, lobbyId: string) => {
        colyseusSDK.auth.token = token;

        const room = await colyseusSDK.joinOrCreate("lobby",
            {lobbyId: lobbyId, guildId: discordSDK.guildId});
        setRoom(room);

        room.onStateChange.once((state: any) => {
            const playersArray: Player[] = Array.from(state.players.values());

            // sort players by score
            const playersSorted = handleCalculatePosition(playersArray, room.sessionId);
            setPlayers(playersSorted);

            // onAdd player
            state.players.onAdd((player: Player, sessionId: string) => {
                console.log("Player joined!", sessionId);

                if (player.sessionId === room.sessionId) {
                    setProfile(player);

                    if (!hasLocalStorage("language")) setLocalStorage("language", player.language);
                    setLanguage(getLocalStorage("language"));
                }

                player.onChange(() => {
                    // swap player
                    const index = players.findIndex((player: Player) => player.sessionId === sessionId);
                    players[index] = player;

                    // sort players by score
                    const playersSorted = handleCalculatePosition(players, room.sessionId);

                    // apply changes
                    setPlayers(playersSorted);
                });

                // add player to list
                players.push(player);

                // sort players by score
                const playersSorted = handleCalculatePosition(players, room.sessionId);
                setPlayers(playersSorted);

                // notify player joined
                if(player.sessionId !== room.sessionId) handleNotifyGameStatus(`${player.username} joined the game!`);
            });

            // onRemove player
            state.players.onRemove((player: any, sessionId: string) => {
                console.log("Player left!", sessionId);

                // remove player from list
                const index = players.findIndex((player: Player) => player.sessionId === sessionId);
                players.splice(index, 1);

                // sort players by score
                const playersSorted = handleCalculatePosition(players, room.sessionId);
                setPlayers(playersSorted);

                // notify player left
                handleNotifyGameStatus(`${player.username} left the game!`);
            });

            // listen currentQuestionOptions
            state.listen("currentQuestionOptions", (currentValue: QuestionOptions) => setCurrentQuestionOptions(currentValue));

            // listen currentTimer
            state.listen("currentTimer", (currentValue: number) => setTimeLeft(currentValue));

            // listen timerClock
            state.listen("timerClock", (currentValue: number) => setTimerClock(currentValue));

            // listen gameStarted
            state.listen("gameStarted", (currentValue: boolean) => {
                setGameStarted(currentValue);

                if (currentValue) {
                    if (theme!==null) setActivity(theme);
                }
            });

            // listen gameEnded
            state.listen("gameEnded", (currentValue: boolean) => setGameEnded(currentValue));

            // listen gameLobby
            state.listen("gameLobby", (currentValue: boolean) => setGameLobby(currentValue));

            // listen prompt
            state.listen("theme", (currentValue: string) => setTheme(currentValue));

            // listen categories
            state.listen("categories", (currentValue: string[]) => setCategories(currentValue));

            // listen awaitingGeneration
            state.listen("awaitingGeneration", (currentValue: boolean) => setAwaitingGeneration(currentValue));

            // listen translations
            state.listen("translations", (currentValue: Map<string, string>) => setTranslations(currentValue));

            // listen setOwner
            state.listen("owner", (currentValue: string) => {
                const profile = players.find((player: Player) => player.sessionId === currentValue);
                setOwnerProfile(profile);
                if (typeof profile !== 'undefined' && profile.sessionId !== currentValue) {
                    // disable dialog
                    setIsDialogPlayGame(false);
                }
                setOwner(currentValue);
            });

            // set timer
            setTimeLeft(state.currentTimer);

            // set currentQuestionOptions
            setCurrentQuestionOptions(state.currentQuestionOptions);
        });

        // listener onError
        room.onError((code: any, message: any) => handleNotifyError(`[${code}] Error Connection: ${message}`));

        room.onMessage("gameOver", (message: any) => {
            console.log(`GameOver: ${message}`);
            setGamePaused(true);
            setGameEnded(true);
            setGameStarted(false);
            setTimeLeft(totalTime);

            // reset answer
            setAnswerSelected(-1);
            setAnswerCorrect(-1);

            // stop background music
            // pauseAudio();
        });

        room.onMessage("next", (message: any) => {
            console.log(`Next: ${message}`);

            // reset answer
            setAnswerSelected(-1);
            setAnswerCorrect(-1);

            // set paused
            setGamePaused(false);

            // sent sound effect
            playSoundNotification();

            // play background music
            playAudio();
        });

        room.onMessage("answerFeedback", (message: AnswerResponse) => {
            if (message.accepted) {
                playSoundCorrect();
                handleConfetti({rectTop: message.rectTop, rectHeight: message.rectHeight});
            } else {
                playSoundIncorrect();
            }
            setAnswerSelected(message.answered);
            setAnswerCorrect(message.correct);

            // stop background music
            // pauseAudio();
        });

        room.onMessage("chatMessage", (message: string) => {
            chatMessages.push(message);
            if (chatMessages.length > 50) {
                chatMessages.shift();
            }
            chatMessages.reverse();
            setChatMessages([...chatMessages]);
        });

        room.onMessage("__playground_message_types", (message: any) => {
            console.log(message);
        });

        room.onMessage("error", (error: any) => {
            handleNotifyError(error.message);
        });
    }

    const handleAnswer = (e: any, i: number) => {
        if (room === null) handleNotifyError("Room not found!");
        if (timeLeft <= 0) {
            handleNotifyError(`${timeLeft} seconds left to answer!`);
            return;
        }
        if (answerSelected > -1) {
            handleNotifyError("You have already selected an answer!");
            return;
        }

        // highlight button
        const rect = e.target.getBoundingClientRect();

        // sent answer to server
        handleSendMessage("answer", {
            answer: i,
            rectTop: rect.top,
            rectHeight: rect.height,
        });

        // set answer selected
        setAnswerSelected(i);

        // set paused
        setGamePaused(true);
        setTimeLeft(15);
    }

    const translate = (key: string | undefined) => {
        const prefix = `||${language}||:`;
        function removePrefix(value: string): string {
            return value.replace(`${prefix}`, "");
        }
        if (!key) return "";
        if (language === "en") return removePrefix(key);
        return removePrefix(translations.get(`${prefix}${key}`) ?? key);
    }

    const handleLanguageChange = (l: any) => {
        setLanguage(l);
        changeLanguage(l).then();
        setLocalStorage("language", l);

        if (typeof room !== 'undefined') room.send("changeLanguage", {language: l});
    }

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

    const openInviteDialog = async () => {
        if (discordSDK === null) {
            handleNotifyError("Discord SDK not found!");
            return;
        }
        await discordSDK.commands.openInviteDialog();
    }

    const setActivity = async (theme: string) => {
        if (discordSDK === null) return;
        await discordSDK.commands.setActivity({
            activity: {
                type: 0,
                details: translate(theme),
                state: i18n.t('Playing'),
            }
        });
    }

    const handleChat = () => {
        const input = (document.getElementById('chat-text') as HTMLInputElement);
        if (input.value.trim()) {
            if (typeof room !== 'undefined') room.send("chatMessage", {content: input.value});
            input.value = "";
        }
        setChatIsVisible(true);
    };

    return (
        <>
            <div className="quiz-wrapper">
                <div className="quiz-container">
                    {/* Lista de jogadores no topo */}
                    {gameStarted || gameLobby ? (
                        <div className="players-list">
                            <PlayerList players={players} hasQuestions={currentQuestionOptions?.question != null}
                                        t={i18n.t}/>
                        </div>
                    ) : ""
                    }

                    {/* Barra de progresso */}
                    {
                        currentQuestionOptions &&
                        currentQuestionOptions.question != null &&
                        !gameEnded &&
                        !gamePaused ? (
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${(timeLeft / totalTime) * 100}%`,
                                        background: timeLeft > 10 ? "#4caf50" : "#ff5555",
                                    }}
                                ></div>
                            </div>
                        ) : ""
                    }

                    {/* Pergunta */}
                    <>
                        {
                            !gameEnded && !gameStarted ?
                                (
                                    <>
                                        <div style={{marginTop: '5px'}}>
                                            {
                                                gameLobby ?
                                                    typeof room !== 'undefined' ?
                                                        theme === null ? (
                                                                profile && profile.sessionId == owner ?
                                                                    (
                                                                        <span>{i18n.t('Choose a theme to start the game!')}</span>
                                                                    ) : (
                                                                        <span>{i18n.t('Waiting for {{username}} to choose the theme...', {username: ownerProfile?.username})}</span>
                                                                    )
                                                            ) :
                                                            (
                                                                <>
                                                                    <div>
                                                                        <b>{ownerProfile?.username}</b> {i18n.t('has chosen the theme')}:
                                                                    </div>
                                                                    <div>
                                                                        <b>{i18n.t(theme)}</b>
                                                                    </div>
                                                                </>
                                                            )
                                                        : (
                                                            <div>
                                                                <div>{i18n.t('Connecting...')}</div>
                                                                <div style={{paddingBottom: '5px', paddingTop: '5px'}}>
                                                                    <Riple color="#FFF" size="small" text=""/>
                                                                </div>
                                                            </div>
                                                        )
                                                    : ""
                                            }
                                            <div>
                                                {
                                                    theme === null && timerClock > 0 ?
                                                        (
                                                            <span style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#FFF',
                                                                fontSize: '14px',
                                                                marginTop: '5px'
                                                            }}>
                                                        <ClockIcon style={{marginRight: '5px'}}/>
                                                                {timerClock} {i18n.t('seconds')}
                                                    </span>
                                                        ) : typeof room !== 'undefined' ? (
                                                            <Riple color="#FFF" size="small" text="" textColor=""/>
                                                        ) : ""
                                                }
                                            </div>
                                        </div>
                                        {theme === null && typeof room !== 'undefined' && !awaitingGeneration ?
                                            (
                                                <div style={{padding: '15px'}}>
                                                    {
                                                        profile && profile.sessionId != owner ?
                                                            (
                                                                <OrbitProgress variant="split-disc" color="#FFF"
                                                                               size="small" text=""
                                                                               textColor=""/>
                                                            ) : (
                                                                timerClock > 0 ? (
                                                                    <button className="btn-play-game-lobby button-pulse"
                                                                            onClick={() => setIsDialogPlayGame(true)}>
                                                                        {i18n.t('Choose Theme')}
                                                                    </button>
                                                                ) : ""
                                                            )
                                                    }
                                                </div>
                                            ) : ""
                                        }
                                    </>
                                )
                                : ""
                        }
                    </>

                    {/* Raking */}
                    {gameEnded ? (
                        <Leaderboard players={players} t={i18n.t}/>
                    ) : (
                        gameStarted ? (
                            <div>
                                <div className="question">
                                    {translate(currentQuestionOptions?.question)}
                                </div>
                                <OptionsGame options={currentQuestionOptions?.options || []}
                                             answerCorrect={answerCorrect}
                                             answerSelected={answerSelected}
                                             handleAnswer={handleAnswer}
                                             translate={translate}/>
                            </div>
                        ) : ""
                    )
                    }
                </div>
            </div>
            {typeof room !== 'undefined' ?
                (
                    <div className="top-right-buttons">
                        {
                            typeof room !== 'undefined' ? (
                                <button className={'btn-ranking'} onClick={() => setIsDialogRanking(!isDialogRanking)}>
                                    <LeaderboardIcon/>
                                </button>
                            ) : ""
                        }
                        <button className="btn-mute" onClick={() => handleToggleSound()}>
                            {isMuted ? <MusicOffIcon/> : <MusicNoteIcon/>}
                        </button>

                        <LanguageSelect selectedLanguage={language} handleLanguageChange={handleLanguageChange}/>
                    </div>
                ) : ""
            }
            <div className="top-left-buttons">
                <button className="btn-home" onClick={() => setIsDialogHome(true)}>
                    <ArrowBackIcon />
                    {i18n.t('Home')}
                </button>
            </div>

            {isDialogHome ? (
                <div className="home-dialog-overlay">
                    <div className="home-dialog">
                        <div className="home-dialog-close">
                            <button onClick={() => setIsDialogHome(false)}>
                                <CloseIcon/>
                            </button>
                        </div>
                        <div className="home-dialog-content">
                            <b>{i18n.t('Go to home!')}</b>
                            <p>{i18n.t('Do you want to leave the game?')}</p>
                            <div className="home-dialog-actions">
                                <button className="btn-cancel" onClick={() => setIsDialogHome(false)}>
                                    {i18n.t('Cancel')}
                                </button>
                                <button className="btn-confirm" onClick={() => {
                                    if (typeof room !== "undefined") room.leave().then();
                                    players.length = 0;
                                    setTheme(null);
                                    navigate('/home');
                                }}>
                                    {i18n.t('Leave')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : ""}

            {isDialogRanking ? (
                <div className="leaderboard-dialog-overlay">
                    <div className="leaderboard-dialog">
                        <div className="leaderboard-dialog-close">
                            <button onClick={() => setIsDialogRanking(false)}>
                                <CloseIcon/>
                            </button>
                        </div>
                        <h1>{i18n.t('Leaderboard')}</h1>
                        <div className="leaderboard">
                            <RankingDialog players={players} t={i18n.t}/>
                        </div>
                    </div>
                </div>
            ) : ""}

            {isDialogPlayGame ? (
                <div className={'dialog-overlay'}>
                    <div className={'dialog'}>
                        <div className={'dialog-content'}>
                            <div className={'dialog-close'}>
                                <button onClick={() => setIsDialogPlayGame(false)}>
                                    <CloseIcon/>
                                </button>
                            </div>
                            <h1>{i18n.t('Customize your Quiz with a Theme')}</h1>
                            <p>{i18n.t('Artificial intelligence creates personalized questions based on the chosen topic.')}</p>
                            <p style={{display: 'flex', justifyContent: 'center'}}><ClockIcon
                                style={{marginRight: '5px'}}/>
                                {timerClock == 0 ? 30 : timerClock} {i18n.t('seconds')}</p>
                            <textarea placeholder={i18n.t('Enter a theme, e.g. Greek Mythology...')}
                                      className={'dialog-textarea'}
                                      maxLength={126}></textarea>
                            <div className={'dialog-actions'}>
                                <button className={'btn-confirm'} onClick={() => handlePlayGame()}>
                                    {i18n.t('Choose Theme')}
                                </button>
                            </div>
                            <div style={{textAlign: 'center', paddingBottom: '5px'}}>
                                <p style={{margin: '10px 0', fontSize: '14px', color: '#666'}}>- {i18n.t('Or')} -</p>
                                <label htmlFor="category">{i18n.t('Category')}</label>
                                <select id={"category"} className={'dialog-select'}>
                                    {
                                        categories.map((category, index) => (
                                            <option key={index} value={category}>{i18n.t(category)}</option>
                                        ))
                                    }
                                </select>
                                <button
                                    onClick={() => handlePlayGameRandom()}
                                    style={{
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: 'auto',
                                        marginTop: '10px'
                                    }}>
                                    <ShuffleIcon style={{marginRight: '8px', fill: 'white'}}/>
                                    {i18n.t('Random Theme')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : ""}
            <div id="chat-container">
                <div id="chat-header" onClick={() => {setChatIsVisible(!isChatVisible)}}>
                    <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                        <ChatIcon/>
                        <h3>{i18n.t('Chat')}</h3> <span>({chatMessages.length})</span>
                    </div>
                    <button id="toggle-chat">
                        {isChatVisible ? <ArrowDropDownIcon/>  : <ArrowDropUpIcon />}
                    </button>
                </div>
                {
                    isChatVisible ? (
                        <>
                            <div id="chat-messages">
                                {
                                    chatMessages.map((message, index) => (
                                        <div key={index}>
                                            <span>{message}</span>
                                        </div>
                                    ))
                                }
                            </div>
                            <form id="chat-form" onSubmit={(e) => {e.preventDefault(); handleChat();}}>
                                <div id="chat-input">
                                    <input type="text" id="chat-text" placeholder={i18n.t('Enter your message...')}
                                           maxLength={56} autoComplete={'off'}/>
                                    <button id="send-button" onClick={handleChat}>
                                        <SendIcon/>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : ""
                }
            </div>
            <div className={'footer'}>
                <div style={{display: 'flex', alignItems: 'center', gap: '7px'}}>
                    <a onClick={openOfficialDiscord} style={{cursor: 'pointer'}}>
                        <img src={discordLogoWhite} alt={'Discord Logo'} className={'logo'}/>
                        <p>{i18n.t('Official Discord Server')}</p>
                    </a>
                    <a onClick={openInviteDialog} style={{cursor: 'pointer'}}>
                        <GroupAddIcon/>
                    </a>
                </div>
            </div>
        </>
    )
}
