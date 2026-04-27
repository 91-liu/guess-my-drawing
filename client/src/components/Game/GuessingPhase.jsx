/**
 * 猜词阶段组件
 */

import { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket.js';
import { SOCKET_EVENTS } from '@shared/constants.js';

export function GuessingPhase() {
  const { roomId, room, playerId, wordPool, playerDrawings } = useRoomStore();
  const [currentGuesserIndex, setCurrentGuesserIndex] = useState(0);
  const [guessingQueue, setGuessingQueue] = useState([]);

  // 初始化猜词队列
  useEffect(() => {
    if (room && room.players) {
      const onlinePlayers = room.players.filter((p) => p.isOnline && !p.isEliminated);
      setGuessingQueue(onlinePlayers.map((p) => p.id));
      console.log('[GuessingPhase] Guessing queue initialized:', onlinePlayers.map((p) => p.nickname));
    }
  }, [room]);

  // 判断当前玩家是否是猜词者
  const currentGuesserId = guessingQueue[currentGuesserIndex];
  const isMyTurn = currentGuesserId === playerId;
  const currentGuesser = room?.players.find((p) => p.id === currentGuesserId);

  // 获取所有玩家的画作
  const allDrawings = Object.entries(playerDrawings || {}).map(([pId, actions]) => {
    const player = room?.players.find((p) => p.id === pId);
    return {
      playerId: pId,
      playerName: player?.nickname || 'Unknown',
      actions: actions,
    };
  });

  return (
    <div className="guessing-phase" style={{ padding: '20px' }}>
      {/* 标题 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '30px',
          backgroundColor: '#E3F2FD',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>🎯 猜词阶段</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          观察所有玩家的画作，猜测他们的秘密词汇
        </p>
      </div>

      {/* 当前猜词者提示 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '30px',
          padding: '15px',
          backgroundColor: isMyTurn ? '#C8E6C9' : '#FFF9C4',
          borderRadius: '8px',
          border: `2px solid ${isMyTurn ? '#4CAF50' : '#FFA726'}`,
        }}
      >
        {isMyTurn ? (
          <>
            <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>轮到你猜词了！</h3>
            <p style={{ margin: 0, color: '#666' }}>从候选词池中选择一个词汇</p>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 10px 0', color: '#F57C00' }}>
              等待 {currentGuesser?.nickname || '...'} 猜词
            </h3>
            <p style={{ margin: 0, color: '#666' }}>请耐心等待其他玩家操作</p>
          </>
        )}
      </div>

      {/* 玩家画作展示 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>所有玩家的画作</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {allDrawings.map((drawing) => (
            <div
              key={drawing.playerId}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <strong>{drawing.playerName}</strong>
                {drawing.playerId === playerId && ' (你)'}
              </div>
              <div style={{ padding: '10px' }}>
                {/* Canvas 缩略图 */}
                <CanvasThumbnail actions={drawing.actions} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 候选词池 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>候选词池 ({wordPool?.length || 0} 个词)</h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          {wordPool?.map((word) => (
            <button
              key={word.id}
              onClick={() => handleWordSelect(word)}
              disabled={!isMyTurn || word.removed}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: word.removed ? '#ccc' : isMyTurn ? '#fff' : '#f5f5f5',
                border: word.removed ? '1px solid #999' : '1px solid #ddd',
                borderRadius: '5px',
                cursor: word.removed ? 'not-allowed' : isMyTurn ? 'pointer' : 'default',
                opacity: word.removed ? 0.5 : 1,
                textDecoration: word.removed ? 'line-through' : 'none',
                color: word.removed ? '#999' : '#333',
              }}
            >
              {word.word}
            </button>
          ))}
        </div>
      </div>

      {/* 玩家列表 */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>玩家列表 ({room?.players.filter((p) => p.isOnline).length} 在线)</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {room?.players.map((player) => (
            <li
              key={player.id}
              style={{
                padding: '8px 12px',
                marginBottom: '5px',
                backgroundColor:
                  player.id === currentGuesserId ? '#e3f2fd' : player.id === playerId ? '#f1f8e9' : '#f5f5f5',
                borderRadius: '4px',
                opacity: player.isOnline ? 1 : 0.5,
                border: player.id === currentGuesserId ? '2px solid #2196F3' : 'none',
              }}
            >
              <span style={{ fontWeight: player.isHost ? 'bold' : 'normal' }}>
                {player.nickname}
                {player.isHost && ' 👑'}
                {player.id === currentGuesserId && ' 🎯 (当前猜词)'}
                {!player.isOnline && ' (离线)'}
              </span>
              {player.id === playerId && <span> (你)</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  function handleWordSelect(word) {
    if (!isMyTurn || word.removed) {
      return;
    }

    console.log('[GuessingPhase] Word selected:', word.word);

    // 发送猜词事件到服务器
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.SUBMIT_GUESS, {
      roomId: roomId,
      playerId: playerId,
      wordId: word.id,
      word: word.word,
    }, (response) => {
      if (response.success) {
        console.log('[GuessingPhase] Guess submitted successfully');

        // 移动到下一个猜词者
        if (currentGuesserIndex < guessingQueue.length - 1) {
          setCurrentGuesserIndex(currentGuesserIndex + 1);
        }
      } else {
        console.error('[GuessingPhase] Guess failed:', response.error);
        alert(`猜词失败: ${response.error}`);
      }
    });
  }
}

/**
 * Canvas 缩略图组件
 */
function CanvasThumbnail({ actions }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !actions || actions.length === 0) return;

    const ctx = canvas.getContext('2d');
    const scale = 0.4; // 缩小到40%

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制线条
    actions.forEach((action) => {
      if (action.type === 'connect') {
        ctx.beginPath();
        ctx.moveTo(action.point1.x * scale, action.point1.y * scale);
        ctx.lineTo(action.point2.x * scale, action.point2.y * scale);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (action.type === 'light_up') {
        ctx.beginPath();
        ctx.arc(action.point.x * scale, action.point.y * scale, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.stroke();
      }
    });
  }, [actions]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={240}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid #eee',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
      }}
    />
  );
}
