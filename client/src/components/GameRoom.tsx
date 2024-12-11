// icons
import VolumeOff from "@mui/icons-material/VolumeOff"
import VolumeUp from "@mui/icons-material/VolumeUp"
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CloseIcon from '@mui/icons-material/Close';
import ClockIcon from '@mui/icons-material/QueryBuilder';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

// css
import "../css/GameRoom.css";

import 'react-toastify/dist/ReactToastify.css';

import {OrbitProgress, Riple} from "react-loading-indicators";

// notifications
import {handleNotifyError, handleNotifyGameStatus} from "../core/Notification.ts";

import {authenticate} from "../utils/Auth.ts";
import {PlayerList} from "./fragments/PlayerList.tsx";
import {Leaderboard} from "./fragments/Leaderboard.tsx";
import {OptionsGame} from "./fragments/OptionsGame.tsx";
import {useEffect, useRef} from "react";

import backgroundMusicGameTimer from "../assets/sounds/music-game-timer.ogg";
import correctSound from "../assets/sounds/correct-answer.ogg";
import incorrectSound from "../assets/sounds/incorrect-answer.ogg";

import logo from "../assets/images/logo.png";

import {useHookState} from "../core/HookState.ts";
import {colyseusSDK} from "../utils/Colyseus.ts";
import {discordSDK} from "../utils/DiscordSDK.ts";
import {Player} from "../schema/Player.ts";
import {handleCalculatePosition} from "../core/Logic.ts";
import {QuestionOptions} from "../schema/QuestionOptions.ts";
import {AnswerResponse} from "../schema/AnswerResponse.ts";
import {getLocalStorage, setLocalStorage} from "../utils/LocalStorage.ts";
import {handleConfetti} from "../core/Effect.ts";
import {RankingDialog} from "./fragments/RankingDialog.tsx";

import {useTranslation} from "react-i18next";


export default function GameRoom(){
    const totalTime = 30; // Tempo total da pergunta

    const {
        // getters
        answerCorrect,
        currentQuestionOptions,
        gameEnded,
        gamePaused,
        gameStarted,
        gameLobby,
        isMuted,
        room,
        categories,
        profile,
        ownerProfile,
        owner,
        players,
        timeLeft,
        theme,
        timerClock,
        isDialogPlayGame,
        isDialogRanking,
        answerSelected,
        // setters
        setPlayers,
        setProfile,
        setOwnerProfile,
        setOwner,
        setCurrentQuestionOptions,
        setGameEnded,
        setGamePaused,
        setGameStarted,
        setGameLobby,
        setRoom,
        setCategories,
        setTheme,
        setTimeLeft,
        setTimerClock,
        setAnswerSelected,
        setAnswerCorrect,
        setIsMuted,
        setIsDialogPlayGame,
        setIsDialogRanking,
    } = useHookState();

    const { t } = useTranslation();

    // const changeLanguage = async (lng: string) => {
    //     await i18n.changeLanguage(lng, () => {
    //         console.log("Language changed to: ", lng);
    //     });
    // };

    // correct sound effect
    const correctSoundEffect = useRef(() => {
        const audio = new Audio(correctSound);
        audio.volume = !isMuted ? 0.2 : 0;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });


    // incorrect sound effect
    const incorrectSoundEffect = useRef(() => {
        const audio = new Audio(incorrectSound);
        audio.volume = !isMuted ? 0.3 : 0;
        audio.currentTime = 0;
        audio.loop = false;
        return audio;
    });

    const handleToggleSound = () => {
        const toggle = !isMuted;
        setIsMuted(toggle);
        setLocalStorage("isMuted", toggle);

        if (toggle) {
            correctSoundEffect.current().pause();
            incorrectSoundEffect.current().pause();
        }
    };

    // background music
    // TODO: Purchase the full track: https://1.envato.market/WDQBgA
    useEffect(() => {
        const isMutedStorage = getLocalStorage("isMuted");
        setIsMuted(isMutedStorage);

        const audio = new Audio(backgroundMusicGameTimer);
        audio.loop = true;
        audio.volume = isMuted ? 0 : 0.08; // Define o volume com base no estado 'isMuted'
        if (gameStarted) audio.play().then(() => console.log("Background music started!"));
        if (gameEnded) audio.pause();

        audio.currentTime = totalTime - timeLeft; // Define o tempo atual com base no tempo restante

        return () => {audio.pause()};
    }, [isMuted, gameStarted, gameEnded]);

    // Discord Embedded SDK: Retrieve user token when under Discord/Embed
    useEffect(() => {
        try {
            console.log("Authenticating with Discord...");
            authenticate().then((response) => {
                const token = response.token;
                console.log("Authenticated with Discord!");

                // connect to colyseus
                handleColyseusConnection(token).then();
            });
        }catch (e) {
            console.error(e);
            handleNotifyError(`Failed to authenticate with Discord. ${e}`);
        }
    }, []);

    // sendMessage
    const handleSendMessage = (message: string, data: any = {}) => {
        if (typeof room === 'undefined') {
            handleNotifyError("Room undefined!");
            return;
        }
        room.send(message, data);
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
        handleSendMessage("startGame", {prompt: prompt?.value});
        setIsDialogPlayGame(false);
    }

    const handleColyseusConnection = async (token: string) => {
        colyseusSDK.auth.token = token;
        const room = await colyseusSDK.joinOrCreate("game", { channelId: discordSDK.channelId, guildId: discordSDK.guildId });
        setRoom(room);

        room.onStateChange.once((state: any) => {
            const playersArray: Player[] = Array.from(state.players.values());

            // sort players by score
            const playersSorted = handleCalculatePosition(playersArray, room.sessionId);
            setPlayers(playersSorted);

            // onAdd player
            state.players.onAdd((player: any, sessionId: string) => {
                console.log("Player joined!", sessionId);

                if (player.sessionId === room.sessionId) {
                    setProfile(player);
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
            state.listen("gameStarted", (currentValue: boolean) => setGameStarted(currentValue));

            // listen gameEnded
            state.listen("gameEnded", (currentValue: boolean) => setGameEnded(currentValue));

            // listen gameLobby
            state.listen("gameLobby", (currentValue: boolean) => setGameLobby(currentValue));

            // listen prompt
            state.listen("theme", (currentValue: string) => setTheme(currentValue));

            // listen categories
            state.listen("categories", (currentValue: string[]) => setCategories(currentValue));

            // listen setOwner
            state.listen("owner", (currentValue: string) => {
                setOwnerProfile(players.find((player: Player) => player.sessionId === currentValue));
                if (profile && profile.sessionId !== currentValue) {
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
        room.onError((code: any, message: any) => {
            handleNotifyError(`[${code}] Error Connection: ${message}`);
        });

        room.onMessage("gameOver", (message: any) => {
            console.log(`GameOver: ${message}`);
            setGamePaused(true);
            setGameEnded(true);
            setGameStarted(false);
            setTimeLeft(totalTime);

            // reset answer
            setAnswerSelected(-1);
            setAnswerCorrect(-1);
        });

        room.onMessage("next", (message: any) => {
            console.log(`Next: ${message}`);

            // reset answer
            setAnswerSelected(-1);
            setAnswerCorrect(-1);

            // set paused
            setGamePaused(false);
        });

        room.onMessage("answerFeedback", (message: AnswerResponse) => {
            if (message.accepted) {
                if (!isMuted) correctSoundEffect.current().play().then(() => console.log("Correct answer!"));
                handleConfetti({rectTop: message.rectTop, rectHeight: message.rectHeight});
            } else {
                if (!isMuted) incorrectSoundEffect.current().play().then(() => console.log("Incorrect answer!"));
            }
            setAnswerSelected(message.answered);
            setAnswerCorrect(message.correct);
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
        setTimeLeft(30);
    }

    return (
        <>
            <div className="quiz-wrapper">
                <div className="quiz-container">
                    {/* Logo */}
                    {!gameStarted ? (
                        <div className="quiz-header">
                            <img src={logo} width={130} style={
                                {
                                    padding: "10px",
                                }
                            } alt={"logo"}/>
                        </div>
                        ): ""
                    }

                    {/* Lista de jogadores no topo */}
                    {gameStarted || gameLobby ? (
                            <div className="players-list">
                                <PlayerList players={players} hasQuestions={currentQuestionOptions?.question != null} t={t} />
                            </div>
                        ): ""
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
                                                                <span>{t('choose_theme_start_game_title')}</span>
                                                            ) : (
                                                                <span>{t('waiting_for', {username: ownerProfile?.username})}</span>
                                                            )
                                                    ) :
                                                    (
                                                        <>
                                                            <div>
                                                                <b>{ownerProfile?.username}</b> has chosen the theme:
                                                            </div>
                                                            <div>
                                                                <b>{theme}</b>
                                                            </div>
                                                        </>
                                                    )
                                                : (
                                                        <div>
                                                            <div>{t('Connecting...')}</div>
                                                            <OrbitProgress variant="split-disc" color="#FFF" size="small"
                                                                           text=""/>
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
                                                        {timerClock} {t('seconds')}
                                                    </span>
                                                ) : (
                                                    <Riple color="#FFF" size="small" text="" textColor=""/>
                                                )
                                            }
                                        </div>
                                    </div>
                                    {theme === null && typeof room !== 'undefined' ?
                                        (
                                            <div style={{padding: '15px'}}>
                                                {
                                                    profile && profile.sessionId != owner ?
                                                    (
                                                        <OrbitProgress variant="split-disc" color="#FFF" size="small" text=""
                                                                       textColor=""/>
                                                    ) : (
                                                        <button className="btn-play-game-lobby button-pulse" onClick={() => setIsDialogPlayGame(true)}>
                                                            {t('Choose theme')}
                                                        </button>
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
                    { gameEnded ? (
                        <Leaderboard players={players} t={t} />
                    ) : (
                        gameStarted ? (
                            <div>
                                <div className="question">
                                    {currentQuestionOptions?.question}
                                </div>
                                <OptionsGame options={currentQuestionOptions?.options || []}
                                             answerCorrect={answerCorrect}
                                             answerSelected={answerSelected} handleAnswer={handleAnswer}/>
                            </div>
                        ) : ""
                    )
                    }
                </div>
            </div>
            <div className="top-right-buttons">
                {
                    typeof room !== 'undefined' ? (
                        <button className={'btn-ranking'} onClick={() => setIsDialogRanking(!isDialogRanking)}>
                            <LeaderboardIcon/>
                        </button>
                    ): ""
                }
                <button className="btn-mute" onClick={() => handleToggleSound()}>
                    {isMuted ? <VolumeOff/> : <VolumeUp/>}
                </button>
            </div>

            {isDialogRanking ? (
                <div className="leaderboard-dialog-overlay">
                    <div className="leaderboard-dialog">
                        <div className="leaderboard-dialog-close">
                            <button onClick={() => setIsDialogRanking(false)}>
                                <CloseIcon/>
                            </button>
                        </div>
                        <h1>{t('Leaderboard')}</h1>
                        <div className="leaderboard">
                            <RankingDialog players={players} t={t}/>
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
                            <h1>{t('choose_theme_title')}</h1>
                            <p>{t('choose_theme_description')}</p>
                            <p style={{display: 'flex', justifyContent: 'center'}}><ClockIcon style={{marginRight: '5px'}}/>
                                {timerClock == 0 ? 30 : timerClock} {t('seconds')}</p>
                            <textarea placeholder={t('choose_theme_placeholder')} className={'dialog-textarea'}
                                      maxLength={126}></textarea>
                            <div className={'dialog-actions'}>
                                <button className={'btn-confirm'} onClick={() => handlePlayGame()}>
                                    {t('choose_theme_button')}
                                </button>
                            </div>
                            <div style={{textAlign: 'center', paddingBottom: '5px'}}>
                                <p style={{margin: '10px 0', fontSize: '14px', color: '#666'}}>- {t('Or')} -</p>
                                <label htmlFor="category">{t('Category')}</label>
                                <select id={"category"} className={'dialog-select'}>
                                    {
                                        categories.map((category, index) => (
                                            <option key={index} value={category}>{t(category)}</option>
                                        ))
                                    }
                                </select>
                                <button
                                    onClick={() => handleNotifyError("This feature is not available yet!")}
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
                                    {t('choose_theme_random')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : ""}
        </>
    )
}
