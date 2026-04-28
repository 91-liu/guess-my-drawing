/**
 * 游戏页面组件
 */

import { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { Canvas } from './Canvas/Canvas';
import { Timer } from './Timer';
import { GuessingPhase } from './GuessingPhase';
import { RoundSummary } from './RoundSummary';
import { GameOver } from './GameOver/GameOver';
import { socketService } from '../../services/socket.js';
import { SOCKET_EVENTS } from '@shared/constants.js';

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
    phase,
    playerDrawings,
  } = useRoomStore();

  // 绘画状态
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [drawMode, setDrawMode] = useState('connect'); // 'connect' 或 'light_up'

  // 如果游戏未开始，不渲染
  if (!gameStarted || !canvasPoints || canvasPoints.length === 0) {
    return null;
  }

  const currentPlayer = room?.players.find((p) => p.id === playerId);

  // 获取当前玩家的绘画动作
  const myDrawActions = playerDrawings[playerId] || [];

  // 将绘画动作转换为线条
  const lines = myDrawActions
    .filter((action) => action.type === 'connect')
    .map((action) => ({
      startPoint: action.point1,
      endPoint: action.point2,
    }));

  return (
    <div className="game" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 计时器 */}
      <Timer />

      {/* 根据阶段显示不同内容 */}
      {phase === 'drawing' && (
        <>
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

            {/* 模式选择 */}
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <button
                onClick={() => setDrawMode('connect')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: drawMode === 'connect' ? '#2196F3' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                连接两点 {drawMode === 'connect' && '✓'}
              </button>
              <button
                onClick={() => setDrawMode('light_up')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: drawMode === 'light_up' ? '#FF9800' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                点亮点 {drawMode === 'light_up' && '✓'}
              </button>
            </div>

            <Canvas
              points={canvasPoints.map(p => ({
                ...p,
                isLit: myDrawActions.some(a => a.type === 'light_up' && a.pointId === p.id)
              }))}
              lines={lines}
              onPointClick={handlePointClick}
              disabled={false}
            />

            <div style={{ marginTop: '15px', textAlign: 'center', color: '#666' }}>
              {drawMode === 'connect'
                ? (selectedPoint ? '已选择第一个点，请点击第二个点进行连接' : '点击选择第一个点')
                : '点击任意点点亮它'}
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
            <h4 style={{ margin: '0 0 10px 0' }}>
              玩家列表 ({room?.players.filter((p) => p.isOnline).length} 在线)
            </h4>
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
        </>
      )}

      {/* 猜词阶段 */}
      {phase === 'guessing' && <GuessingPhase />}

      {/* 回合结算 */}
      {phase === 'round_end' && <RoundSummary />}

      {/* 游戏结束 */}
      {phase === 'game_over' && <GameOver />}
    </div>
  );

  function handlePointClick(point) {
    console.log('[Game] Point clicked:', point, 'Mode:', drawMode);

    if (drawMode === 'light_up') {
      // 点亮模式：直接发送点亮动作
      const socket = socketService.getSocket();
      socket.emit(SOCKET_EVENTS.DRAW_ACTION, {
        roomId,
        playerId,
        action: {
          type: 'light_up',
          pointId: point.id,
          point: { id: point.id, x: point.x, y: point.y },
        },
      }, (response) => {
        if (response && response.success) {
          console.log('[Game] Light up action confirmed');
        } else {
          console.error('[Game] Light up failed:', response?.error);
          alert(`点亮失败: ${response?.error || '未知错误'}`);
        }
      });

      console.log('[Game] Light up point:', point.id);
    } else if (drawMode === 'connect') {
      // 连接模式：需要选择两个点
      if (!selectedPoint) {
        // 选择第一个点
        setSelectedPoint(point);
        console.log('[Game] First point selected:', point.id);
      } else {
        // 选择第二个点，发送连接动作
        if (selectedPoint.id !== point.id) {
          const socket = socketService.getSocket();
          socket.emit(SOCKET_EVENTS.DRAW_ACTION, {
            roomId,
            playerId,
            action: {
              type: 'connect',
              point1: { id: selectedPoint.id, x: selectedPoint.x, y: selectedPoint.y },
              point2: { id: point.id, x: point.x, y: point.y },
            },
          }, (response) => {
            if (response && response.success) {
              console.log('[Game] Connect action confirmed');
            } else {
              console.error('[Game] Connect failed:', response?.error);
              alert(`连接失败: ${response?.error || '未知错误'}`);
            }
          });

          console.log('[Game] Connect points:', selectedPoint.id, '->', point.id);
        }
        // 清除选择
        setSelectedPoint(null);
      }
    }
  }
}