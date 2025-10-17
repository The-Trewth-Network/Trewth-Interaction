import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DeploymentInfo { block:number; blockTime:number; fee:number; liquidityAdded:boolean; liquidityTokens:string; nativeLiquidity:string; txHash:string; }
interface PoolInit { block:number; blockTime:number; currency0:string; currency1:string; fee:number; hooks:string; initialPrice_token1_per_token0:string; sqrtPriceX96:string; tick:number; tickSpacing:number; txHash:string; }
interface TokenMetadata {
  block:number;
  blockTime:number;
  eventDescription:string;
  eventTime:number;
  eventTypes:string[];
  fullname:string;
  geoTag:string;
  publisherAllocationBps:number;
  supplementLink:string;
  ticker:string;
  txHash:string;
  weatherTag:string;
}
interface PoolInfoResponse {
  poolid:string;
  tokenaddress:string;
  tokenpublisher:string;
  tokenmetadata: TokenMetadata;
  deploymentinfo: DeploymentInfo;
  poolinit: PoolInit;
  tags: string[];
  createdatblock:number;
  createdattime:number;
}

interface TokenInfoProps { poolId: string; apiBase?: string; }

const TokenInfo: React.FC<TokenInfoProps> = ({ poolId, apiBase = 'http://10.18.23.51:3000' }) => {
  const [data, setData] = useState<PoolInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!poolId) return;
    setLoading(true);
    setError('');
    axios.post(`${apiBase}/pool_info/pool_info`, { pool_id: poolId })
      .then(res => { setData(res.data); })
      .catch(() => { setError('获取数据失败'); setData(null); })
      .finally(() => setLoading(false));
  }, [poolId, apiBase]);

  if (!poolId) return <div style={placeholderStyle}>未提供 poolId</div>;
  if (loading) return <div style={placeholderStyle}>加载中...</div>;
  if (error) return <div style={errorStyle}>{error}</div>;
  if (!data) return <div style={placeholderStyle}>无数据</div>;

  const meta = data.tokenmetadata;

  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{meta.fullname} ({meta.ticker})</h2>
          <span style={subtitleStyle}>事件代币详细信息</span>
        </div>
        <div style={metaGridStyle}>
          <MetaItem label="事件简介" value={meta.eventDescription} />
          <MetaItem label="事件时间" value={meta.eventTime?.toString()} />
          <MetaItem label="事件类型" value={meta.eventTypes.join(' / ')} />
          <MetaItem label="地理标签" value={meta.geoTag} />
          <MetaItem label="天气标签" value={meta.weatherTag} />
          <MetaItem label="合约地址" value={data.tokenaddress} />
          <MetaItem label="发布者地址" value={data.tokenpublisher} />
          <MetaItem label="部署时间戳" value={data.deploymentinfo.blockTime.toString()} />
          <MetaItem label="补充链接" value={<a href={meta.supplementLink} target="_blank" rel="noreferrer" style={linkStyle}>访问</a>} />
        </div>
        <div style={tagsWrapperStyle}>
          {data.tags.map(t => <span key={t} style={tagStyle}>{t}</span>)}
        </div>
      </div>
    </div>
  );
};

const MetaItem: React.FC<{label:string; value: React.ReactNode}> = ({label, value}) => (
  <div style={metaItemStyle}>
    <div style={metaLabelStyle}>{label}</div>
    <div style={metaValueStyle}>{value || '-'}</div>
  </div>
);

// 样式参考 EventCoinTading.tsx 并做精简
const wrapperStyle: React.CSSProperties = { padding:'24px', maxWidth:'900px', margin:'0 auto' };
const cardStyle: React.CSSProperties = { background:'#fff', borderRadius:16, padding:28, boxShadow:'0 4px 6px rgba(0,0,0,0.1)', border:'1px solid #e5e7eb' };
const headerStyle: React.CSSProperties = { marginBottom:24, textAlign:'center' };
const titleStyle: React.CSSProperties = { margin:0, fontSize:26, fontWeight:600, background:'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' };
const subtitleStyle: React.CSSProperties = { fontSize:14, color:'#6b7280' };
const metaGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20, marginBottom:24 };
const metaItemStyle: React.CSSProperties = { display:'flex', flexDirection:'column', gap:6, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'12px 16px' };
const metaLabelStyle: React.CSSProperties = { fontSize:12, color:'#6b7280', fontWeight:500 };
const metaValueStyle: React.CSSProperties = { fontSize:14, fontWeight:600, color:'#374151', wordBreak:'break-word' };
const tagsWrapperStyle: React.CSSProperties = { display:'flex', flexWrap:'wrap', gap:8, marginBottom:0 };
const tagStyle: React.CSSProperties = { padding:'6px 12px', background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', color:'#4f46e5', fontSize:12, fontWeight:600, borderRadius:20, border:'1px solid #c7d2fe' };
const placeholderStyle: React.CSSProperties = { padding:24, textAlign:'center', color:'#6b7280' };
const errorStyle: React.CSSProperties = { padding:24, textAlign:'center', color:'#dc2626' };
const linkStyle: React.CSSProperties = { color:'#6366f1', textDecoration:'underline', fontWeight:600 };

export default TokenInfo;
