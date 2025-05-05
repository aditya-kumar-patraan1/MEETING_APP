import { Routes, Route } from "react-router-dom";
import "./App.css";
import LobbyScreen from "./screens/Lobby";
import { MyScreen } from "./screens/MyScreen";
import { useState } from "react";

function App() {
  const [isDark,setIsDark] = useState(false);
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LobbyScreen isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="/MyScreen/:roomId" element={<MyScreen isDark={isDark} setIsDark={setIsDark} />} />
      </Routes>
    </div>
  );
}

export default App;
