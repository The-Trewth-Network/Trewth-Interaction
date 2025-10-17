import React, { useState, useEffect } from "react";
import EventCoinTrading from "./Trading/EventCoinTading";
import TokenInfo from "./Trading/TokenInfo";

interface TradingProps { initialPoolId?: string; }

const Trading: React.FC<TradingProps> = ({ initialPoolId }) => {
  const [activePoolId, setActivePoolId] = useState<string>(initialPoolId || "");
  useEffect(()=>{ if (initialPoolId) setActivePoolId(initialPoolId); }, [initialPoolId]);

  return (
    <div style={outerLayout}>
      <div style={leftPane}>
        <EventCoinTrading onPoolSelect={setActivePoolId} initialPoolId={activePoolId || undefined} />
      </div>
      <div style={rightPane}>
        <TokenInfo poolId={activePoolId} />
      </div>
    </div>
  );
};

const outerLayout: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 24,
  padding: '24px',
  boxSizing: 'border-box',
  width: '100%',
};
const leftPane: React.CSSProperties = { flex: '0 0 760px', maxWidth: 760 };
const rightPane: React.CSSProperties = { flex: 1, minWidth: 0 };

export default Trading;
