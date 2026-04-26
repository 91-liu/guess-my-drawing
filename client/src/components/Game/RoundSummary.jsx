/**
 * 回合结算组件 - 显示回合结束时的分数变化和秘密词汇公布
 */

import { useEffect, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

export function RoundSummary() {
  const { room, playerId, roundSummary, phase } = useRoomStore();
  const [showAnimation, setShowAnimation] = useState(true);

  // 如果不是回合结束阶段，不显示
  if (phase !== 'round_end' || !roundSummary) {
    return null;
  }

  // 3秒后关闭动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 计算积分榜
  const leaderboard = roundSummary.players
    .map((p) => ({
      ...p,
      scoreChange: roundSummary.scoreChanges[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  // 当前玩家的数据
  const currentPlayerData = leaderboard.find((p) => p.id === playerId);

  return (
    <div className="round-summary" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 标题 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '30px',
          backgroundColor: '#FFF3E0',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #FF9800',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', color: '#F57C00' }}>
          🎊 第 {roundSummary.round} 轮结束
        </h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          公布所有玩家的秘密词汇和得分变化
        </p>
      </div>

      {/* 秘密词汇公布 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>所有玩家的秘密词汇</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px',
          }}
        >
          {Object.entries(roundSummary.playerWords).map(([pid, word]) => {
            const player = room?.players.find((p) => p.id === pid);
            const isMe = pid === playerId;
            const scoreChange = roundSummary.scoreChanges[pid] || 0;

            return (
              <div
                key={pid}
                style={{
                  backgroundColor: scoreChange < 0 ? '#FFEBEE' : '#E8F5E9',
                  padding: '15px',
                  borderRadius: '8px',
                  border: scoreChange < 0 ? '2px solid #F44336' : '1px solid #ddd',
                  animation: showAnimation && scoreChange < 0 ? 'shake 0.5s' : 'none',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {player?.nickname}
                  {isMe && ' (你)'}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#333',
                    letterSpacing: '2px',
                    marginBottom: '8px',
                  }}
                >
                  {word}
                </div>
                {scoreChange < 0 && (
                  <div
                    style={{
                      color: '#D32F2F',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    ⬇️ {scoreChange} 分
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 积分榜 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>积分榜</h3>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        >
          {leaderboard.map((player, index) => {
            const isMe = player.id === playerId;
            const scoreChange = player.scoreChange;

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: isMe ? '#E3F2FD' : '#f5f5f5',
                  borderRadius: '4px',
                  border: scoreChange < 0 ? '2px solid #F44336' : 'none',
                  animation: showAnimation && scoreChange < 0 ? 'shake 0.5s' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#666' }}>
                    #{index + 1}
                  </span>
                  <span style={{ fontWeight: isMe ? 'bold' : 'normal' }}>
                    {player.nickname}
                    {player.isHost && ' 👑'}
                    {isMe && ' (你)'}
                  </span>
                  {scoreChange < 0 && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#D32F2F',
                        fontWeight: 'bold',
                      }}
                    >
                      ({scoreChange} 分)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {player.score} 分
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 等待下一步提示 */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#E1F5FE',
          borderRadius: '8px',
        }}
      >
        <p style={{ margin: 0, color: '#0277BD', fontSize: '16px' }}>
          等待房主开始下一轮或结束游戏...
        </p>
      </div>

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  );
}