import React, { useState, useRef, useEffect, FormEvent } from 'react';
import AgentSetting from './Agent_setting';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  ts: number;
}

const Session: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init-1', role: 'agent', content: 'Hello, I am your on-chain Agent. Ask me something or give an instruction.', ts: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // auto scroll on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      content: input.trim(),
      ts: Date.now()
    };
    setInput('');
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      // Demo agent echo
      await new Promise(r => setTimeout(r, 500));
      const agentMsg: ChatMessage = {
        id: 'a-' + Date.now(),
        role: 'agent',
        content: 'Echo: ' + userMsg.content,
        ts: Date.now()
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (e: any) {
      const agentErr: ChatMessage = {
        id: 'a-err-' + Date.now(),
        role: 'agent',
        content: 'Error processing message.',
        ts: Date.now()
      };
      setMessages(prev => [...prev, agentErr]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div style={pageShell}>
      <div style={layoutWrapper}>
        <div style={chatColumn}>
          <div style={chatCardStyle}>
            <div style={headerStyle}>
              <h3 style={titleStyle}>Agent Session</h3>
            </div>
            <div ref={listRef} style={messageListStyle}>
              {messages.map(m => (
                <div key={m.id} style={bubbleWrapperStyle(m.role)}>
                  <div style={bubbleStyle(m.role)}>
                    <div style={bubbleMetaStyle}>
                      <strong>{m.role === 'user' ? 'You' : 'Agent'}</strong>
                      <span style={{fontSize: 11, opacity: .7, marginLeft: 8}}>{new Date(m.ts).toLocaleTimeString()}</span>
                    </div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} style={inputRowStyle}>
              <input
                style={inputStyle}
                placeholder={sending ? 'Sending...' : 'Type a message...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                style={sendButtonStyle(!input.trim() || sending)}
              >Send</button>
            </form>
          </div>
        </div>
        <div style={settingsColumn}>
          <div style={settingsScrollArea}>
            <AgentSetting />
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const rootStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  padding: '40px 20px',
  background: 'linear-gradient(135deg,#667eea,#764ba2)',
  boxSizing: 'border-box'
};

const chatCardStyle: React.CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  height: '70vh',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0',
  background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
};

const messageListStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px 20px',
  overflowY: 'auto',
  background: 'linear-gradient(180deg,#fafafa,#f3f4f6)'
};

const bubbleWrapperStyle = (role: 'user' | 'agent'): React.CSSProperties => ({
  display: 'flex',
  justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: 14
});

const bubbleStyle = (role: 'user' | 'agent'): React.CSSProperties => ({
  maxWidth: '70%',
  background: role === 'user' ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#edf2f7',
  color: role === 'user' ? '#fff' : '#1e293b',
  padding: '12px 16px',
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: 14,
  position: 'relative'
});

const bubbleMetaStyle: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.85,
  marginBottom: 4,
  letterSpacing: .5,
  display: 'flex',
  alignItems: 'center'
};

const inputRowStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderTop: '1px solid #e2e8f0',
  background: '#f8fafc',
  display: 'flex',
  gap: 12
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  border: '2px solid #e2e8f0',
  borderRadius: 12,
  fontSize: 14,
  outline: 'none',
  transition: 'all .25s'
};

const sendButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '12px 22px',
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 12,
  border: 'none',
  background: disabled ? '#cbd5e1' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
  transition: 'all .25s'
});

// 新增布局样式
const pageShell: React.CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  background: 'linear-gradient(135deg,#667eea,#764ba2)',
  padding: '32px 24px',
  boxSizing: 'border-box'
};
const layoutWrapper: React.CSSProperties = {
  maxWidth: 1400,
  margin: '0 auto',
  display: 'flex',
  gap: 24,
  alignItems: 'stretch',
  flexWrap: 'wrap'
};
const chatColumn: React.CSSProperties = {
  flex: '1 1 640px',
  minWidth: 480,
  display: 'flex'
};
const settingsColumn: React.CSSProperties = {
  flex: '0 1 420px',
  minWidth: 340,
  display: 'flex',
  flexDirection: 'column'
};
const settingsScrollArea: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 0
};

export default Session;
