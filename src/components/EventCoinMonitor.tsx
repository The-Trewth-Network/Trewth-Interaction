import React from "react";
import CoinLiquity from "./EventCoinMonitor/CoinLiquity";

const EventCoinMonitor: React.FC = () => {
    return (
        <div>
            <h2>事件币池监控</h2>
            <CoinLiquity />
        </div>
    );
};

export default EventCoinMonitor;

