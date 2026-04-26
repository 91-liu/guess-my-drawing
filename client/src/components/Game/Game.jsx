/**
 * 游戏页面组件
 */

import { useEffect } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { Canvas } from './Canvas/Canvas';

export function Game() {
  const {
    roomId,
    room,
    playerId,
    gameStarted,
    secretWord,
    wordPool,
    canvasPoints,
    round,
  } = useRoomStore();

  // 如果游戏未开始，不渲染
  if (!gameStarted || !canvasPoints || canvasPoints.length === 0) {
    return null;
  }

  const currentPlayer = room?.players.find((p) => p.id === playerId);
  const isOnline = currentPlayer?.isOnline;

  return (
    <div className="game" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 游戏信息 */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #4CAF50',
        }}
      >
        <h2 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
          第 {round} 轮 - 绘画阶段
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>房间ID:</strong> {roomId}
          </div>
          <div>
            <strong>在线玩家:</strong> {room?.players.filter((p) => p.isOnline).length}
          </div>
        </div>
      </div>

      {/* 秘密词汇卡片 */}
      <div
        style={{
          backgroundColor: '#FFF9C4',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #FFD700',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#F57C00' }}>你的秘密词汇</h3>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#E65100',
            letterSpacing: '5px',
          }}
        >
          {secretWord}
        </div>
        <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '14px' }}>
          请在画布上绘制这个词汇，但不要告诉其他玩家！
        </p>
      </div>

      {/* 候选词池预览 */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>候选词池 ({wordPool?.length || 0} 个词)</h4>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {wordPool?.slice(0, 12).map((word) => (
            <span
              key={word.id}
              style={{
                padding: '4px 12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                fontSize: '14px',
                border: '1px solid #ddd',
              }}
            >
              {word.word}
            </span>
          ))}
          {wordPool?.length > 12 && (
            <span
              style={{
                padding: '4px 12px',
                backgroundColor: '#eee',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#999',
              }}
            >
              +{wordPool.length - 12} 更多...
            </span>
          )}
        </div>
      </div>

      {/* 画布 */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>绘画区域</h3>
        <Canvas points={canvasPoints} onPointClick={handlePointClick} disabled={false} />
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            连接两点
          </button>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            点亮点
          </button>
        </div>
      </div>

      {/* 玩家列表 */}
      <div
        style={{
          marginTop: '20px',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
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
                backgroundColor: player.id === playerId ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '4px',
                opacity: player.isOnline ? 1 : 0.5,
              }}
            >
              <span style={{ fontWeight: player.isHost ? 'bold' : 'normal' }}>
                {player.nickname}
                {player.isHost && ' 👑'}
                {!player.isOnline && ' (离线)'}
              </span>
              {player.id === playerId && <span> (你)</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  function handlePointClick(point) {
    console.log('[Game] Point clicked:', point);
    // TODO: 实现点选逻辑（连接或点亮）
  }
}
