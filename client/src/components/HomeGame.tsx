import NavHomeGame from "./NavHomeGame.tsx";

import "../css/HomeGame.css";

export default function HomeGame() {
    return (
        <div className="game-container">
            {/* Header */}
            <header className="game-header">
                <h1 className="game-title">Trivia GenAI</h1>
            </header>

            {/* Main Content */}
            <main className="game-main">
                <button className="btn create-room">✨ Criar Sala</button>
                <button className="btn room-list">📜 Lista de Salas</button>
            </main>

            {/* Navbar */}
            <footer>
                <NavHomeGame />
            </footer>
        </div>
    )
}
