import React, { useEffect, useState } from "react";
import axios from "axios";

interface Pool {
    poolid: string;
    tokenaddress: string;
    tokenmetadata: {
        fullname: string;
        ticker: string;
        eventDescription: string;
        geoTag: string;
        weatherTag: string;
    };
}

const EventCoinTrading: React.FC = () => {
    const [pools, setPools] = useState<Pool[]>([]);
    const [selectedToken, setSelectedToken] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        axios.get("http://192.168.50.102:3000/swap/get_pools")
            .then(res => setPools(res.data))
            .catch(() => setPools([]));
    }, []);

    const handleTrade = async () => {
        if (!selectedToken || !amount) return;
        setLoading(true);
        try {
            // 这里假设后端有 /swap/trade 接口，实际请根据你的后端接口调整
            await axios.post("http://10.18.23.250:3000/swap/trade", {
                token: selectedToken,
                amount: amount
            });
            alert("交易请求已发送！");
        } catch (e) {
            alert("交易失败");
        }
        setLoading(false);
    };

    return (
        <div>
            <h2>选择代币进行交易</h2>
            <select
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
            >
                <option value="">请选择代币</option>
                {pools.map(pool => (
                    <option key={pool.poolid} value={pool.tokenaddress}>
                        {pool.tokenmetadata.fullname} ({pool.tokenmetadata.ticker})
                    </option>
                ))}
            </select>
            <input
                type="number"
                placeholder="输入交易数量"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
            />
            <button onClick={handleTrade} disabled={loading}>
                {loading ? "交易中..." : "交易"}
            </button>
        </div>
    );
};

export default EventCoinTrading;
