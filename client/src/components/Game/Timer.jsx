/**
 * 计时器组件 - 显示绘画阶段倒计时
 */

import { useRoomStore } from '../../store/useRoomStore';
import { useEffect, useState } from 'react';

export function Timer() {
  const timeLeft = useRoomStore((state) => state.timeLeft);
  const phase = useRoomStore((state) => state.phase);
  const [prevTime, setPrevTime] = useState(timeLeft);
  const [animate, setAnimate] = useState(false);

  // 如果不是绘画阶段，不显示
  if (phase !== 'drawing') {
    return null;
  }

  // 触发数字跳动动画
  useEffect(() => {
    if (timeLeft !== prevTime) {
      setAnimate(true);
      setPrevTime(timeLeft);
      setTimeout(() => setAnimate(false), 500);
    }
  }, [timeLeft, prevTime]);

  // 格式化时间
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // 时间警告样式（最后10秒）
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isUrgent = timeLeft <= 5;

  return (
    <div
      className={`
        fixed top-5 right-5 px-8 py-4 rounded-lg shadow-lg z-50
        ${isUrgent ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}
        ${isWarning ? 'animate-pulse' : ''}
        transition-all duration-300 ease-in-out
      `}
    >
      <div className="text-sm mb-1 opacity-90 text-white">
        剩余时间
      </div>
      <div className={`text-4xl font-mono font-bold text-white ${animate ? 'animate-number-bounce' : ''}`}>
        {timeString}
      </div>
      {isWarning && (
        <div className="text-xs mt-1 opacity-90 text-white">
          ⚠️ 时间即将结束！
        </div>
      )}
    </div>
  );
}
