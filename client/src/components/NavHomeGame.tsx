import '../css/NavHomeGame.css';

import {useState} from "react";

export default function NavHomeGame() {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <nav className="navbar">
            <button
                className={`nav-btn ${activeTab === "home" ? "active" : ""}`}
                onClick={() => setActiveTab("home")}
            >
                🏠 Home
            </button>
            <button
                className={`nav-btn ${activeTab === "ranking" ? "active" : ""}`}
                onClick={() => setActiveTab("ranking")}
            >
                🏆 Ranking
            </button>
        </nav>
    )
}