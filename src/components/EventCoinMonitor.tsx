import React from "react";
import CoinLiquity from "./EventCoinMonitor/CoinLiquity";
import NewlyListToken from "./EventCoinMonitor/NewlyListToken";

interface EventCoinMonitorProps { onSelectPool?: (poolId:string)=>void }

const EventCoinMonitor: React.FC<EventCoinMonitorProps> = ({ onSelectPool }) => {
    return (
        <div>
            <h2>事件币池监控</h2>
            <CoinLiquity onSelectPool={onSelectPool} />
            <NewlyListToken onSelectPool={onSelectPool} />
        </div>
    );
};

export default EventCoinMonitor;
