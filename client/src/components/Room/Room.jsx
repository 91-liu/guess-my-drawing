/**
 * 房间页面组件
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/useRoomStore';
import { socketService } from '../../services/socket.js';

export function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, playerId, leaveRoom, gameStarted, secretWord, wordPool, canvasPoints } = useRoomStore();
  const [copied, setCopied] = useState(false);

  // 设置 Socket 监听器
  useEffect(() => {
    socketService.connect();
    useRoomStore.getState().setupListeners();

    return () => {
      // 清理监听器（如果需要）
    };
  }, []);

  // 如果房间不存在，重定向到大厅
  useEffect(() => {
    if (!room && !useRoomStore.getState().loading) {
      console.log('[Room] No room data, redirecting to lobby');
      navigate('/');
    }
  }, [room, navigate]);

  const handleLeaveRoom = async () => {
    await leaveRoom();
    navigate('/');
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    const socket = socketService.getSocket();

    socket.emit('start_game', { roomId }, (response) => {
      if (response.success) {
        console.log('[Room] Game started successfully');
      } else {
        console.error('[Room] Failed to start game:', response.error);
        alert(`无法开始游戏: ${response.error}`);
      }
    });
  };

  if (!room) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost;

  return (
    <div className="room" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <h1>房间: {roomId}</h1>
        <button onClick={handleLeaveRoom} style={{ padding: '10px 20px' }}>
          离开房间
        </button>
      </div>

      {/* 房间信息 */}
      <div
        className="room-info"
        style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '30px',
        }}
      >
        <p>
          <strong>房间ID:</strong> {roomId}
          <button
            onClick={handleCopyRoomId}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            {copied ? '已复制!' : '复制'}
          </button>
        </p>
        <p>
          <strong>房主:</strong>{' '}
          {room.players.find((p) => p.id === room.hostId)?.nickname || '未知'}
        </p>
        <p>
          <strong>玩家数量:</strong> {room.players.length}/10
        </p>
        <p>
          <strong>状态:</strong>{' '}
          {room.status === 'waiting' ? '等待玩家加入' : '游戏中'}
        </p>
      </div>

      {/* 玩家列表 */}
      <div className="players-list" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>玩家列表 ({room.players.filter(p => p.isOnline).length} 在线)</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {room.players.map((player) => (
            <li
              key={player.id}
              style={{
                padding: '10px',
                border: '1px solid #eee',
                marginBottom: '5px',
                borderRadius: '4px',
                backgroundColor: player.id === playerId ? '#f0f8ff' : '#fff',
                opacity: player.isOnline ? 1 : 0.5,
              }}
            >
              <span style={{ fontWeight: player.isHost ? 'bold' : 'normal' }}>
                {player.nickname}
                {player.isHost && ' 👑 (房主)'}
                {!player.isOnline && ' (离线)'}
              </span>
              {player.id === playerId && <span> (你)</span>}
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: player.isOnline ? 'green' : 'red',
                  marginLeft: '10px',
                }}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* 开始游戏按钮（仅房主可见） */}
      {isHost && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleStartGame}
            disabled={room.players.filter((p) => p.isOnline).length < 2}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: room.players.filter((p) => p.isOnline).length >= 2 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: room.players.filter((p) => p.isOnline).length >= 2 ? 'pointer' : 'not-allowed',
            }}
          >
            {room.players.filter((p) => p.isOnline).length >= 2 ? '开始游戏' : '需要至少2名在线玩家'}
          </button>
        </div>
      )}
    </div>
  );
}
