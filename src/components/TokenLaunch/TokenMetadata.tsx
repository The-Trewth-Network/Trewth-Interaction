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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <form onSubmit={handleSubmit} style={{
        maxWidth: 800,
        width: '100%',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '30px',
          textAlign: 'center'
        }}>Event Token Metadata</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
          <div style={{gridColumn: 'span 1'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              Token Full Name
            </label>
            <input 
              value={fullname} 
              onChange={e=>setFullname(e.target.value)} 
              required
              placeholder="Enter token full name"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <div style={{gridColumn: 'span 1'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              Token Ticker
            </label>
            <input 
              value={ticker} 
              onChange={e=>setTicker(e.target.value)} 
              required
              placeholder="Enter ticker symbol"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <div style={{gridColumn: 'span 1'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              Geographic Location
            </label>
            <input 
              value={geoTag} 
              onChange={e=>setGeoTag(e.target.value)} 
              required
              placeholder="e.g., New York, USA"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          
          <div style={{gridColumn: 'span 1'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              Weather Condition
            </label>
            <input 
              value={weatherTag} 
              onChange={e=>setWeatherTag(e.target.value)} 
              required
              placeholder="e.g., Sunny, Rainy"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%)',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#4a5568',
            marginBottom: '16px'
          }}>Event Categories (Select 4)</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
            {Array.from({length:4}).map((_,i)=>(
              <select 
                key={i} 
                value={eventTypes[i]} 
                onChange={e=>handleEventTypeChange(i,e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                {EVENT_TYPE_OPTIONS.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ))}
          </div>
        </div>

        <div style={{marginTop: '24px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Event Description
          </label>
          <textarea 
            rows={4} 
            value={eventDescription} 
            onChange={e=>setEventDescription(e.target.value)}
            placeholder="Provide a detailed description of the event..."
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              resize: 'vertical',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        
        <div style={{marginTop: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Supplement Link
          </label>
          <input 
            value={supplementLink} 
            onChange={e=>setSupplementLink(e.target.value)}
            placeholder="https://example.com/details"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        
        <div style={{marginTop: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Event Time
          </label>
          <input 
            value={new Date(eventTime * 1000).toLocaleString()} 
            readOnly
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '16px',
              background: '#f7fafc',
              color: '#718096',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button 
          type='submit' 
          disabled={submitting}
          style={{
            marginTop: '32px',
            width: '100%',
            padding: '14px 24px',
            background: submitting ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: submitting ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {submitting ? 'Submitting...' : 'Submit to Blockchain'}
        </button>

        {(status || txHash || backendData) && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: status.includes('失败') || status.includes('错误') ? '#fef2f2' : '#f0fdf4',
            borderRadius: '10px',
            border: `2px solid ${status.includes('失败') || status.includes('错误') ? '#fecaca' : '#bbf7d0'}`
          }}>
            {status && (
              <div style={{
                fontSize: '14px',
                color: status.includes('失败') || status.includes('错误') ? '#dc2626' : '#16a34a',
                fontWeight: '500'
              }}>
                Status: {status}
              </div>
            )}
            {txHash && (
              <div style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#4a5568'
              }}>
                Transaction Hash: <span style={{
                  fontFamily: 'monospace',
                  background: '#e2e8f0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  wordBreak: 'break-all'
                }}>{txHash}</span>
              </div>
            )}
            {backendData && (
              <pre style={{
                marginTop: '12px',
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '12px',
                color: '#4a5568',
                border: '1px solid #e2e8f0'
              }}>
                {JSON.stringify(backendData, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f7fafc',
          borderRadius: '10px',
          borderLeft: '4px solid #667eea'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#4a5568',
            marginBottom: '8px',
            lineHeight: '1.6'
          }}>
            <strong>Note:</strong> This form collects metadata and submits it to the backend. If the backend returns a transaction structure, it will trigger wallet signing and sending.
          </p>
          <p style={{
            fontSize: '13px',
            color: '#718096',
            margin: 0,
            lineHeight: '1.6'
          }}>
            For contracts requiring msg.sender = user address, transactions must be signed and sent from the frontend.
          </p>
        </div>
      </form>
    </div>
  );
};

export default TokenMetadataForm;
