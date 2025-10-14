import React from "react";
import TokenLaunch from "./components/TokenLaunch";
import Trading from "./components/Trading";
import EventCoinMonitor from "./components/EventCoinMonitor";

function App() {
    return (
        <div className="App">
            <TokenLaunch />
            <Trading />
            <EventCoinMonitor />
        </div>
    );
}

export default App;