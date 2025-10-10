import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ethers } from "ethers";

interface PoolInit { currency0: string; currency1: string; fee: number; hooks: string; initialPrice_token1_per_token0: string; sqrtPriceX96: string; tick: number; tickSpacing: number; }
interface PoolMetadata { fullname: string; ticker: string; eventDescription: string; geoTag: string; weatherTag: string; }
interface Pool { poolid: string; tokenaddress: string; tokenmetadata: PoolMetadata; poolinit: PoolInit; }

type Direction = 'N2T' | 'T2N'; // 原生 -> 代币 或 代币 -> 原生

const EventCoinTrading: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [direction, setDirection] = useState<Direction>('N2T');
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");

  useEffect(() => {
    /**
     * 本地示例数据文件 (Cmd/Ctrl+点击可在 JetBrains 系列 IDE 中跳转)
     * @see src/sample_data/EventCoinTading_swap_get_pools.json
     */
    axios.get("http://192.168.50.102:3000/swap/get_pools")
      .then(res => setPools(res.data))
      .catch(() => setPools([]));
  }, []);

  const selectedPool = useMemo(() => pools.find(p => p.poolid === selectedPoolId), [pools, selectedPoolId]);

  const offlineEstimate = (amt: string, pool: Pool, dir: Direction): string => {
    try {
      if (!amt) return "";
      const decimals = 18; // 假设两边 18 位
      const amountIn = ethers.parseUnits(amt, decimals);
      const sqrtP = BigInt(pool.poolinit.sqrtPriceX96); // Q64.96
      const priceNum = sqrtP * sqrtP; // Q128.192
      const Q192 = 1n << 192n;
      const fee = BigInt(pool.poolinit.fee); // 例:3000
      const amountAfterFee = amountIn * (1_000_000n - fee) / 1_000_000n; // fee 基于 1e6
      let outRaw: bigint;
      if (dir === 'N2T') {
        // 原生 -> 代币 : amountAfterFee * P  (P = priceNum/Q192)
        outRaw = amountAfterFee * priceNum / Q192;
      } else {
        // 代币 -> 原生 : amountAfterFee / P = amountAfterFee * Q192 / priceNum
        if (priceNum === 0n) return "";
        outRaw = amountAfterFee * Q192 / priceNum;
      }
      return ethers.formatUnits(outRaw, decimals);
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (selectedPool && amount && parseFloat(amount) > 0) {
      setEstimatedOutput(offlineEstimate(amount, selectedPool, direction));
    } else {
      setEstimatedOutput("");
    }
  }, [selectedPool, amount, direction]);

  const directionLabel = direction === 'N2T' ? '原生 -> 事件代币' : '事件代币 -> 原生';
  const inputPlaceholder = direction === 'N2T' ? '输入原生币数量' : '输入事件代币数量';
  const outputUnit = direction === 'N2T' ? selectedPool?.tokenmetadata.ticker : 'NATIVE';

  return (
    <div>
      <h2>离线估价交易 (不发起链上模拟)</h2>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 8 }}>方向:</label>
        <label style={{ marginRight: 12 }}>
          <input type="radio" value="N2T" checked={direction === 'N2T'} onChange={() => setDirection('N2T')} /> 原生 -&gt; 代币
        </label>
        <label>
          <input type="radio" value="T2N" checked={direction === 'T2N'} onChange={() => setDirection('T2N')} /> 代币 -&gt; 原生
        </label>
        <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>{directionLabel}</span>
      </div>
      <select value={selectedPoolId} onChange={e => setSelectedPoolId(e.target.value)}>
        <option value="">请选择代币池</option>
        {pools.map(pool => (
          <option key={pool.poolid} value={pool.poolid}>
            {pool.tokenmetadata.fullname} ({pool.tokenmetadata.ticker})
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder={inputPlaceholder}
        value={amount}
        onChange={e => setAmount(e.target.value)}
        min="0"
        style={{ marginLeft: 8 }}
      />
      {selectedPool && (
        <div style={{ marginTop: 8 }}>
          <small>Fee: {selectedPool.poolinit.fee} | TickSpacing: {selectedPool.poolinit.tickSpacing} | Tick: {selectedPool.poolinit.tick}</small><br />
          <small>代币: {selectedPool.tokenmetadata.ticker} ({selectedPool.tokenmetadata.fullname})</small>
        </div>
      )}
      {estimatedOutput && (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: 0 }}>离线估计输出: {estimatedOutput} {outputUnit}</p>
        </div>
      )}
      <p style={{ fontSize: 12, color: '#888' }}>提示: 该估价未考虑滑点与实际流动性影响，仅基于当前 sqrtPriceX96 和费率。</p>
      <button disabled={!selectedPoolId || !amount}>暂未实现真实交易发送</button>
    </div>
  );
};

export default EventCoinTrading;
