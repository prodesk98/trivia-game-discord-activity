import './App.css'

// components
import GameRoom from "./components/GameRoom.tsx";

import "./utils/I18n.ts";
import {ToastContainer} from "react-toastify";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Auth from "./components/Auth.tsx";
import {GameProvider} from "./components/GameProvider.tsx";
import Home from "./components/Home.tsx";
import Ranking from "./components/Ranking.tsx";


function App() {
  return (
    <>
        <BrowserRouter>
            <GameProvider>
                <Routes>
                    <Route path="/" element={<Auth />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/lobby/:lobbyId" element={<GameRoom />} />
                </Routes>
            </GameProvider>
        </BrowserRouter>
        <ToastContainer
            position="top-left"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light" />
        {/* Same as */}
        <ToastContainer />
    </>
  )
}

export default App
