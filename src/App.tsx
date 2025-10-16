import React from "react";
import TokenLaunch from "./components/TokenLaunch";
import Trading from "./components/Trading";
import EventCoinMonitor from "./components/EventCoinMonitor";
import Session from "./components/AgentInteraction/Session"; // 新增会话页面

function App() {
    return (
        <div className="App">
            <TokenLaunch />
            <Trading />
            <EventCoinMonitor />
            <Session /> {/* 新增：带内嵌设置的会话页面 */}
        </div>
    );
}

export default App;