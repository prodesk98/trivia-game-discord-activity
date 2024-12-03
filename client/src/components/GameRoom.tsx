// icons
import VolumeOff from "@mui/icons-material/VolumeOff"
import VolumeUp from "@mui/icons-material/VolumeUp"
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// css
import "../css/GameRoom.css";

import 'react-toastify/dist/ReactToastify.css';

import {OrbitProgress} from "react-loading-indicators";

// notifications
import {handleNotifyError, handleNotifyGameStatus} from "../core/Notification.ts";

// TODO: Uncomment this block to enable Discord authentication
// import {authenticate} from "../utils/Auth.ts";
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


export default function GameRoom(){
    const totalTime = 30; // Tempo total da pergunta

    const {
        // getters
        answerCorrect,
        currentQuestionOptions,
        gameEnded,
        gamePaused,
        gameStarted,
        isMuted,
        room,
        profile,
        owner,
        players,
        timeLeft,
        answerSelected,
        // setters
        setPlayers,
        setProfile,
        setOwner,
        setCurrentQuestionOptions,
        setGameEnded,
        setGamePaused,
        setGameStarted,
        setRoom,
        setTimeLeft,
        setAnswerSelected,
        setAnswerCorrect,
        setIsMuted,
    } = useHookState();

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

        if (!isMuted)
            audio.play().then(() => console.log("Background music started!"));
        else
            audio.pause();

        if (timeLeft <= 0) {
            audio.pause();
            audio.currentTime = 0;
            return () => {
                audio.pause();
            }
        }

        audio.currentTime = 30 - timeLeft; // Define o tempo atual com base no tempo restante

        return () => {
            audio.pause();
        };
    }, [isMuted, gameStarted]);

    // Discord Embedded SDK: Retrieve user token when under Discord/Embed
    useEffect(() => {
        handleColyseusConnection("123").then();
        // TODO: Uncomment this block to enable Discord authentication
        // try {
        //     console.log("Authenticating with Discord...");
        //     authenticate().then((response) => {
        //         const token = response.token;
        //         console.log("Authenticated with Discord!");
        //         // setToken(token);
        //
        //         // connect to colyseus
        //         handleColyseusConnection(token).then();
        //     });
        // }catch (e) {
        //     console.error(e);
        //     handleNotifyError(`Failed to authenticate with Discord. ${e}`);
        // }
    }, []);

    // sendMessage
    const handleSendMessage = (message: string, data: any = {}) => {
        if (typeof room === 'undefined') {
            handleNotifyError("Room undefined!");
            return;
        }
        room.send(message, data);
    }

    const handleColyseusConnection = async (token: string) => {
        colyseusSDK.auth.token = token;
        const room = await colyseusSDK.joinOrCreate("game", { channelId: discordSDK.channelId });
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

            // listen gameStarted
            state.listen("gameStarted", (currentValue: boolean) => setGameStarted(currentValue));

            // listen gameEnded
            state.listen("gameEnded", (currentValue: boolean) => setGameEnded(currentValue));

            // listen setOwner
            state.listen("owner", (currentValue: string) => setOwner(currentValue));

            // set timer
            setTimeLeft(state.currentTimer);

            // set currentQuestionOptions
            setCurrentQuestionOptions(state.currentQuestionOptions);
        });

        // listener onError
        room.onError((code: any, message: any) => {
            handleNotifyError(`[${code}] Error Connection: ${message}`);
        });

        // listener onMessage
        room.onMessage("startGame", (message: any) => {
            console.log(message);
            setGamePaused(false);
            setGameStarted(true);
            setGameEnded(false);
        });

        room.onMessage("gameOver", (message: any) => {
            console.log(`GameOver: ${message}`);
            setGamePaused(true);
            setGameEnded(true);
            setGameStarted(false);
            setTimeLeft(0);

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
                    {gameStarted ? (
                            <div className="players-list">
                                <PlayerList players={players} answerSelected={answerSelected} hasQuestions={currentQuestionOptions?.question != null} />
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
                                <OrbitProgress variant="split-disc" color="#FFF" size="small" text="" textColor="" />
                            )
                            : ""
                        }
                    </>

                    {/* Raking */}
                    { gameEnded ? (
                        <Leaderboard players={players} />
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
                {!gameStarted && typeof room !== 'undefined' && (profile && profile.sessionId == owner) ? (
                    <button className={`btn-play-game ${isMuted ? "muted" : ""}`}
                            onClick={() => handleSendMessage("startGame", {})}>
                        <PlayArrowIcon/> Start Game
                    </button>
                ) : ""}
                <button className="btn-mute" onClick={() => handleToggleSound()}>
                    {isMuted ? <VolumeOff/> : <VolumeUp/>}
                </button>
            </div>
        </>
    )
}
