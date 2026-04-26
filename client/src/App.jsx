import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../../shared/constants.js';

const socket = io('http://localhost:3000');

function App() {
  const [connected, setConnected] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[Client] Connected to server');
      setConnected(true);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('[Client] Disconnected from server');
      setConnected(false);
    });

    socket.on(SOCKET_EVENTS.TEST_RESPONSE, (data) => {
      console.log('[Client] Test response:', data);
      setTestMessage(JSON.stringify(data, null, 2));
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.DISCONNECT);
      socket.off(SOCKET_EVENTS.TEST_RESPONSE);
    };
  }, []);

  const sendTestEvent = () => {
    socket.emit(SOCKET_EVENTS.TEST_EVENT, { message: 'Hello from client!' });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎨 绘画猜词游戏</h1>
      <div style={{ marginBottom: '20px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: connected ? 'green' : 'red',
            marginRight: '8px',
          }}
        />
        <span>{connected ? '已连接到服务器' : '未连接'}</span>
      </div>
      <button
        onClick={sendTestEvent}
        disabled={!connected}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: connected ? 'pointer' : 'not-allowed',
          opacity: connected ? 1 : 0.5,
        }}
      >
        发送测试消息
      </button>
      {testMessage && (
        <pre
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}
        >
          {testMessage}
        </pre>
      )}
    </div>
  );
}

export default App;
