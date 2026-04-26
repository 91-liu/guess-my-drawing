/**
 * 游戏结束组件 - 显示获胜者和最终积分榜
 */

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
    <div className="game-over p-5 max-w-5xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="text-center mb-10 bg-blue-50 p-8 rounded-xl border-4 border-blue-400 animate-success">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">
          🎉 游戏结束 🎉
        </h1>
        <p className="text-lg text-gray-600">
          感谢所有玩家的参与！
        </p>
      </div>

      {/* 获胜者展示 */}
      {winner && (
        <div className={`
          text-center mb-10 p-10 rounded-xl shadow-2xl animate-success
          ${isMeWinner
            ? 'bg-yellow-50 border-4 border-yellow-400'
            : 'bg-white border-4 border-green-500'}
        `}
        style={{ animationDelay: '0.3s' }}
        >
          <div className="text-7xl mb-5 animate-bounce-slow">👑</div>
          <h2 className={`
            text-4xl font-bold mb-4
            ${isMeWinner ? 'text-yellow-700' : 'text-green-700'}
          `}>
            {isMeWinner ? '恭喜你获得胜利！' : '获胜者'}
          </h2>
          <div className={`
            text-5xl font-bold mb-3
            ${isMeWinner ? 'text-orange-600' : 'text-green-800'}
          `}>
            {winner.nickname}
          </div>
          <div className="text-xl text-gray-600">
            最终得分: {winner.score} 分
          </div>
        </div>
      )}

      {/* 最终积分榜 */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-5 text-center">最终积分榜</h2>
        <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
          {finalLeaderboard.map((player, index) => {
            const isMe = player.id === playerId;
            const isWinner = winner && player.id === winner.id;
            const isEliminated = player.isEliminated || player.score === 0;

            return (
              <div
                key={player.id}
                className={`
                  flex justify-between items-center p-4 mb-3 rounded-lg animate-fade-in
                  ${isWinner
                    ? 'bg-yellow-50 border-2 border-yellow-400'
                    : isMe
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : isEliminated
                    ? 'bg-gray-100 border-2 border-dashed border-gray-400 opacity-60'
                    : 'bg-white border border-gray-200'}
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-600">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className={`text-lg ${isMe ? 'font-bold' : ''}`}>
                    {player.nickname}
                    {player.isHost && ' 👑'}
                    {isMe && <span className="text-blue-600 ml-1">(你)</span>}
                    {isEliminated && !isWinner && (
                      <span className="text-red-600 text-sm ml-2">(已淘汰)</span>
                    )}
                  </span>
                </div>
                <div className={`
                  text-3xl font-bold
                  ${isWinner ? 'text-yellow-500' : isEliminated ? 'text-gray-400' : 'text-blue-500'}
                `}>
                  {player.score} 分
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 游戏统计 */}
      <div className="text-center p-6 bg-gray-100 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-4">游戏统计</h3>
        <div className="flex justify-center gap-12">
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-4xl font-bold text-blue-500 animate-number-bounce">
              {roundSummary.round}
            </div>
            <div className="text-gray-600 text-sm">总轮次</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-4xl font-bold text-blue-500 animate-number-bounce">
              {finalLeaderboard.length}
            </div>
            <div className="text-gray-600 text-sm">参与玩家</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <div className="text-4xl font-bold text-green-500 animate-number-bounce">
              {finalLeaderboard.filter((p) => p.score > 0).length}
            </div>
            <div className="text-gray-600 text-sm">存活玩家</div>
          </div>
        </div>
      </div>
    </div>
  );
}
