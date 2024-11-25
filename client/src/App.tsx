import './App.css'

// components
import GameRoom from "./components/GameRoom.tsx";
import {ToastContainer} from "react-toastify";

function App() {
  return (
    <>
        <GameRoom />
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
