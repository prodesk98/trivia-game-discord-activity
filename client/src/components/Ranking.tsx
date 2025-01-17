import {useEffect, useState} from "react";
import trophy from "../../src/assets/icons/trophy.png";
import "../css/Ranking.css";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import i18n from "../utils/I18n.ts";
import {useNavigate} from "react-router-dom";
import {OrbitProgress} from "react-loading-indicators";


export default function Ranking(){
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [topThree, setTopThree] = useState<any[]>([]);
    const [others, setOthers] = useState<any[]>([]);

    const handleAvatar = (id: string, avatar: string) =>  {
        return `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp?size=256`;
    }

    useEffect(() => {
        const fetchRanking = async () => {
            const url = `${import.meta.env.VITE_NODE_ENV !== 'production' ? 'http://localhost:2567' : '.proxy'}/api/ranking`;
            try {
                const response = await fetch(url);
                const data = await response.json();

                // Get the top 3 players
                for (let i = 0; i < 3; i++) {
                    setTopThree((prev) => [
                        ...prev,
                        {
                            id: data[i].userId,
                            discordId: data[i]?.discordId,
                            username: data[i].username,
                            score: data[i].total,
                            avatar: data[i].avatar
                        }
                    ]);
                }
                // Get the rest of the players
                for (let i = 3; i < data.length; i++) {
                    setOthers((prev) => [
                        ...prev,
                        {
                            id: data[i].userId,
                            discordId: data[i]?.discordId,
                            username: data[i].username,
                            score: data[i].total,
                            avatar: data[i].avatar
                        }
                    ]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRanking().then();
    }, []);

    return (
        <>
            <div className="lb-container">
                {(
                    <>
                        `${import.meta.env.VITE_NODE_ENV !== 'production' ? 'http://localhost:2567' : '.proxy'}/api/ranking`
                    </>
                )}
                { loading ? (
                    <div className="lb-loading">
                        <OrbitProgress color="#fff" />
                        <p>{i18n.t('Loading')}...</p>
                    </div>
                ) : (
                <>
                    <div className="lb-top-three">
                        {topThree.map((player, index) => (
                            <div
                                key={player.id}
                                className={`lb-top-player ${index === 0 ? 'lb-first' : index === 1 ? 'lb-second' : 'lb-third'}`}
                            >
                                <div className="lb-avatar-container">
                                    <img
                                        src={handleAvatar(player.discordId, player.avatar)}
                                        alt={`Avatar of ${player.username}`}
                                        className="lb-avatar"
                                        onError={(e: any) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
                                        }}
                                    />
                                </div>
                                <p className="lb-rank">
                                    {index === 0 && (
                                        <div className="lb-trophy">
                                            <img src={trophy} alt="Trophy" width={'15px'} />
                                        </div>
                                    )}
                                    #{index + 1}
                                </p>
                                <p className="lb-name">{player.username}</p>
                                <p className="lb-score">{player.score.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="lb-other-players">
                        {others.map((player, index) => (
                            <div key={player.id} className="lb-player-row">
                                <span className="lb-row-rank">#{index + 4}</span>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '5px',
                                    width: '100%',
                                }}>
                                    <div className="lb-player-details">
                                        <img
                                            src={handleAvatar(player.discordId, player.avatar)}
                                            alt={`Avatar of ${player.username}`}
                                            className="lb-avatar-small"
                                            onError={(e: any) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
                                            }}
                                        />
                                        <span className="lb-row-name">{player.username}</span>
                                    </div>
                                    <span className="lb-row-score">{player.score.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
                )}
            </div>
            <div className="top-left-buttons">
                <button className="btn-home" onClick={() => navigate("/home")}>
                    <ArrowBackIcon/>
                    {i18n.t('Home')}
                </button>
            </div>
        </>
    );
}
