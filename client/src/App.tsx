import './App.css'

// components
import GameRoom from "./components/GameRoom.tsx";

import "./utils/I18n.ts";
import {ToastContainer} from "react-toastify";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Auth from "./components/Auth.tsx";
import {GameProvider} from "./components/GameProvider.tsx";


function App() {
  return (
    <>
            <BrowserRouter>
                <GameProvider>
                    <Routes>
                        <Route path="/" element={<Auth />} />
                        <Route path="/lobby/:lobbyId" element={<GameRoom />} />
                    </Routes>
                </GameProvider>
            </BrowserRouter>
        <ToastContainer
            position="top-right"
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
