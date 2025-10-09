// TokenMetadata.tsx (Injected Wallet 模式)
import React, { useState, useEffect, FormEvent } from 'react';
import { ethers } from 'ethers';

interface BackendTxPayload {
  to: string;
  data: string;
  value?: string; // 十进制或 0x
  chainId?: number;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface BackendResponse {
  success: boolean;
  message?: string;
  // 如果后端希望前端签名并广播，返回交易结构
  tx?: BackendTxPayload;
  // 如果后端已广播，可回传 hash
  txHash?: string;
  // 其它链上解析数据
  extra?: any;
}

const EVENT_TYPE_OPTIONS = [
  'Crypto Related',
  'Prediction',
  'RWA',
  'Layer1',
  'DeFi',
  'Sports',
  'Macro',
  'Meme'
];

const TokenMetadataForm: React.FC = () => {
  // 基础元数据字段
  const [geoTag, setGeoTag] = useState('');
  const [weatherTag, setWeatherTag] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>(['Crypto Related','Prediction','RWA','Layer1']);
  const [eventDescription, setEventDescription] = useState('');
  const [supplementLink, setSupplementLink] = useState('');
  const [eventTime, setEventTime] = useState<number>(Math.floor(Date.now()/1000));
  const [fullname, setFullname] = useState('');
  const [ticker, setTicker] = useState('');

  // UI 状态
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [backendData, setBackendData] = useState<any>(null);

  // 每 30 秒刷新一次当前时间戳（用户也可以手动修改逻辑，如需固定首次加载则移除）
  useEffect(()=>{
    const id = setInterval(()=> setEventTime(Math.floor(Date.now()/1000)), 30000);
    return ()=> clearInterval(id);
  },[]);

  const handleEventTypeChange = (idx:number, val:string) => {
    const copy = [...eventTypes];
    copy[idx] = val;
    setEventTypes(copy);
  };

  const validate = (): string | null => {
    if (!fullname.trim()) return 'Fullname 不能为空';
    if (!ticker.trim()) return 'Ticker 不能为空';
    if (!geoTag.trim()) return 'geoTag 不能为空';
    if (!weatherTag.trim()) return 'weatherTag 不能为空';
    if (!eventDescription.trim()) return 'eventDescription 不能为空';
    if (!supplementLink.trim()) return 'supplementLink 不能为空';
    if (eventTypes.length !== 4) return '必须 4 个 eventTypes';
    if (new Set(eventTypes).size !== 4) return 'eventTypes 不可重复';
    return null;
  };

  // 发送到后端：后端可两种模式
  // 1. 直接链上广播 => 返回 { success:true, txHash }
  // 2. 仅返回待签名交易结构 => 返回 { success:true, tx:{...} }，前端使用钱包签名发送
  const submitToBackend = async () : Promise<BackendResponse> => {
    const payload = {
      geoTag,
      weatherTag,
      eventTypes,
      eventDescription,
      supplementLink,
      eventTime,
      fullname,
      ticker
    };
    const resp = await fetch('/api/event-token/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return resp.json();
  };

  const signAndSendIfNeeded = async (tx: BackendTxPayload) => {
    if (!(window as any).ethereum) {
      throw new Error('未检测到钱包，无法签名');
    }
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();

    // 规范化 value
    const valueHex = tx.value
      ? (tx.value.startsWith('0x') ? tx.value : ethers.toQuantity(BigInt(tx.value)))
      : '0x0';

    const request: any = {
      to: tx.to,
      data: tx.data,
      value: valueHex
    };
    if (tx.gasLimit) request.gas = tx.gasLimit;
    if (tx.maxFeePerGas) request.maxFeePerGas = tx.maxFeePerGas;
    if (tx.maxPriorityFeePerGas) request.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;

    // 直接使用 signer.sendTransaction 构造对象也可，但如果后端已经给了精确字段，用 provider.send 更直观
    const sent = await signer.sendTransaction(request);
    return sent.hash;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('');
    setTxHash('');
    setBackendData(null);

    const err = validate();
    if (err) { setStatus('校验失败: ' + err); return; }

    setSubmitting(true);
    setStatus('提交后端中...');
    try {
      const res = await submitToBackend();
      setBackendData(res);
      if (!res.success) {
        setStatus('后端失败: ' + (res.message || 'unknown'));
        return;
      }
      if (res.txHash) {
        setStatus('后端已广播完成');
        setTxHash(res.txHash);
        return;
      }
      if (res.tx) {
        setStatus('收到待签名交易，调用钱包签名...');
        try {
          const hash = await signAndSendIfNeeded(res.tx);
          setTxHash(hash);
          setStatus('交易已发送，等待确认 (hash 已返回)');
        } catch (signErr:any) {
          setStatus('签名/发送失败: ' + (signErr.shortMessage || signErr.message));
        }
      } else {
        setStatus('成功但无 tx / txHash，检查后端逻辑');
      }
    } catch (ex:any) {
      setStatus('请求错误: ' + (ex.message || ex.toString()));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{maxWidth:760,margin:'0 auto',fontFamily:'sans-serif'}}>
      <h3>Event Token Metadata</h3>
      <div style={{display:'grid',gap:12}}>
        <label>Fullname
          <input value={fullname} onChange={e=>setFullname(e.target.value)} required />
        </label>
        <label>Ticker
          <input value={ticker} onChange={e=>setTicker(e.target.value)} required />
        </label>
        <label>geoTag
          <input value={geoTag} onChange={e=>setGeoTag(e.target.value)} required />
        </label>
        <label>weatherTag
          <input value={weatherTag} onChange={e=>setWeatherTag(e.target.value)} required />
        </label>

        <fieldset style={{border:'1px solid #ccc',padding:10}}>
          <legend>eventTypes (4)</legend>
          {Array.from({length:4}).map((_,i)=>(
            <div key={i}>
              <select value={eventTypes[i]} onChange={e=>handleEventTypeChange(i,e.target.value)}>
                {EVENT_TYPE_OPTIONS.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </fieldset>

        <label>eventDescription
          <textarea rows={3} value={eventDescription} onChange={e=>setEventDescription(e.target.value)} />
        </label>
        <label>supplementLink
          <input value={supplementLink} onChange={e=>setSupplementLink(e.target.value)} />
        </label>
        <label>eventTime (UNIX 秒)
          <input value={eventTime} readOnly />
        </label>
      </div>

      <div style={{marginTop:16}}>
        <button type='submit' disabled={submitting}>{submitting ? '提交中...' : '提交后端'}</button>
      </div>

      <div style={{marginTop:16,fontSize:13,lineHeight:1.5}}>
        <div>状态: {status}</div>
        {txHash && <div>TxHash: {txHash}</div>}
        {backendData && <pre style={{background:'#f5f5f5',padding:8,overflow:'auto',maxHeight:200}}>{JSON.stringify(backendData,null,2)}</pre>}
      </div>

      <p style={{marginTop:20,fontSize:12,color:'#666'}}>说明: 本表单仅收集元数据并提交给后端。若后端返回 tx 结构则会唤起钱包签名并发送。若后端直接广播则前端仅展示 txHash。</p>
      <p style={{marginTop:6,fontSize:12,color:'#666'}}>若合约需要 msg.sender = 用户地址，则必须在前端由用户签名发送（或使用 meta-tx / forwarder 设计）。单纯后端代发会变成后端地址作为 sender。</p>
    </form>
  );
};

export default TokenMetadataForm;
