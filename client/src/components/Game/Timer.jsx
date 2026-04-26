/**
 * 计时器组件 - 显示绘画阶段倒计时
 */

import { useRoomStore } from '../../store/useRoomStore';

export function Timer() {
  const timeLeft = useRoomStore((state) => state.timeLeft);
  const phase = useRoomStore((state) => state.phase);

  // 如果不是绘画阶段，不显示
  if (phase !== 'drawing') {
    return null;
  }

  // 格式化时间
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // 时间警告样式（最后10秒）
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isUrgent = timeLeft <= 5;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 30px',
        backgroundColor: isUrgent ? '#ff4444' : isWarning ? '#ff9800' : '#4CAF50',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '32px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        zIndex: 1000,
        animation: isWarning ? 'pulse 1s infinite' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.9 }}>
        剩余时间
      </div>
      <div>{timeString}</div>
      {isWarning && (
        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
          ⚠️ 时间即将结束！
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
    </div>
  );
}
