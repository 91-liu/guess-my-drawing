/**
 * 游戏结束组件 - 显示获胜者和最终积分榜
 */

import { useEffect } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

export function GameOver() {
  const { room, playerId, roundSummary } = useRoomStore();

  // 如果没有游戏结束数据，不显示
  if (!roundSummary || !roundSummary.gameEnded) {
    return null;
  }

  const winner = roundSummary.winner;
  const isMeWinner = winner && winner.id === playerId;

  // 计算最终积分榜
  const finalLeaderboard = roundSummary.players.sort((a, b) => b.score - a.score);

  return (
    <div className="game-over" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 标题 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          backgroundColor: '#E1F5FE',
          padding: '30px',
          borderRadius: '12px',
          border: '3px solid #0288D1',
        }}
      >
        <h1 style={{ margin: '0 0 15px 0', color: '#01579B', fontSize: '48px' }}>
          🎉 游戏结束 🎉
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '18px' }}>
          感谢所有玩家的参与！
        </p>
      </div>

      {/* 获胜者展示 */}
      {winner && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            backgroundColor: isMeWinner ? '#FFF9C4' : '#FFF',
            padding: '40px',
            borderRadius: '12px',
            border: `3px solid ${isMeWinner ? '#F9A825' : '#4CAF50'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>👑</div>
          <h2
            style={{
              margin: '0 0 15px 0',
              color: isMeWinner ? '#F57F17' : '#2E7D32',
              fontSize: '36px',
            }}
          >
            {isMeWinner ? '恭喜你获得胜利！' : '获胜者'}
          </h2>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: isMeWinner ? '#E65100' : '#1B5E20',
              marginBottom: '10px',
            }}
          >
            {winner.nickname}
          </div>
          <div style={{ fontSize: '24px', color: '#666' }}>
            最终得分: {winner.score} 分
          </div>
        </div>
      )}

      {/* 最终积分榜 */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>最终积分榜</h2>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '12px',
            border: '2px solid #ddd',
          }}
        >
          {finalLeaderboard.map((player, index) => {
            const isMe = player.id === playerId;
            const isWinner = winner && player.id === winner.id;
            const isEliminated = player.isEliminated || player.score === 0;

            return (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 20px',
                  marginBottom: '10px',
                  backgroundColor: isWinner
                    ? '#FFF9C4'
                    : isMe
                    ? '#E3F2FD'
                    : isEliminated
                    ? '#F5F5F5'
                    : '#fff',
                  borderRadius: '8px',
                  border: isWinner
                    ? '2px solid #F9A825'
                    : isEliminated
                    ? '2px dashed #999'
                    : '1px solid #ddd',
                  opacity: isEliminated && !isWinner ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '24px',
                      color: isWinner ? '#F9A825' : '#666',
                    }}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span style={{ fontWeight: isMe ? 'bold' : 'normal', fontSize: '18px' }}>
                    {player.nickname}
                    {player.isHost && ' 👑'}
                    {isMe && ' (你)'}
                    {isEliminated && !isWinner && ' (已淘汰)'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: isWinner ? '#F9A825' : isEliminated ? '#999' : '#2196F3',
                  }}
                >
                  {player.score} 分
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 游戏统计 */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#F5F5F5',
          borderRadius: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0' }}>游戏统计</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
              {roundSummary.round}
            </div>
            <div style={{ color: '#666' }}>总轮次</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
              {finalLeaderboard.length}
            </div>
            <div style={{ color: '#666' }}>参与玩家</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
              {finalLeaderboard.filter((p) => p.score > 0).length}
            </div>
            <div style={{ color: '#666' }}>存活玩家</div>
          </div>
        </div>
      </div>
    </div>
  );
}
