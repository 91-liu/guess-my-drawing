/**
 * 画布组件 - 使用 HTML5 Canvas 渲染点和线，带动画效果
 */

import { useEffect, useRef, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@shared/constants.js';

export function Canvas({ points, lines = [], onPointClick, disabled = false }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [animationLines, setAnimationLines] = useState([]);

  // 响应式调整画布大小
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const maxWidth = Math.min(container.clientWidth - 40, CANVAS_WIDTH);
        const scale = maxWidth / CANVAS_WIDTH;
        const scaledHeight = CANVAS_HEIGHT * scale;

        setCanvasSize({
          width: maxWidth,
          height: scaledHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 线条渐进动画
  useEffect(() => {
    if (lines && lines.length > 0) {
      // 新线条添加时触发动画
      const newLines = lines.slice(animationLines.length);
      if (newLines.length > 0) {
        // 添加动画标记
        const animatedNewLines = newLines.map((line, index) => ({
          ...line,
          animating: true,
          animationProgress: 0,
        }));

        setAnimationLines([...animationLines, ...animatedNewLines]);

        // 动画结束后移除标记
        setTimeout(() => {
          setAnimationLines(lines.map((line) => ({ ...line, animating: false })));
        }, 800);
      }
    } else {
      setAnimationLines([]);
    }
  }, [lines]);

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scale = canvasSize.width / CANVAS_WIDTH;

    // 清空画布
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // 绘制��景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // 绘制线条（带动画）
    if (animationLines && animationLines.length > 0) {
      animationLines.forEach((line) => {
        drawLine(ctx, line, scale);
      });
    }

    // 绘制所有点（带闪烁效果）
    if (points && points.length > 0) {
      points.forEach((point) => {
        drawPoint(ctx, point, scale, hoveredPoint);
      });
    }
  }, [points, animationLines, canvasSize, hoveredPoint]);

  // 处理鼠标移动
  const handleMouseMove = (e) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = canvasSize.width / CANVAS_WIDTH;

    // 查找鼠标位置附近的点
    const hoveredPt = points?.find((point) => {
      const px = point.x * scale;
      const py = point.y * scale;
      const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
      return distance <= 10;
    });

    setHoveredPoint(hoveredPt || null);
  };

  // 处理点击
  const handleClick = (e) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scale = canvasSize.width / CANVAS_WIDTH;

    // 查找点击的点
    const clickedPoint = points?.find((point) => {
      const px = point.x * scale;
      const py = point.y * scale;
      const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
      return distance <= 10;
    });

    if (clickedPoint && onPointClick) {
      onPointClick(clickedPoint);
    }
  };

  return (
    <div className="text-center my-5 animate-fade-in">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        className={`
          border-2 border-gray-300 rounded-lg
          ${disabled ? 'cursor-not-allowed opacity-60' : hoveredPoint ? 'cursor-pointer' : 'cursor-default'}
          bg-gray-100 max-w-full
          hover:border-blue-400 transition-colors duration-200
          shadow-lg hover:shadow-xl
        `}
        style={{ touchAction: 'none' }}
      />
      {points && (
        <div className="mt-2 text-sm text-gray-600">
          共 {points.length} 个点 | 点击选择点
        </div>
      )}
    </div>
  );
}

/**
 * 绘制单个点（带闪烁效果）
 */
function drawPoint(ctx, point, scale, hoveredPoint) {
  const x = point.x * scale;
  const y = point.y * scale;
  const baseRadius = 5;
  const radius = baseRadius * scale;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  // 根据状态设置颜色和效果
  if (point.isLit) {
    // 点亮状态：亮色闪烁
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
  } else if (hoveredPoint?.id === point.id) {
    // 悬停状态：高亮
    ctx.fillStyle = '#4CAF50';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(76, 175, 80, 0.8)';
  } else {
    // 默认状态：灰色
    ctx.fillStyle = '#999';
    ctx.shadowBlur = 0;
  }

  ctx.fill();
  ctx.shadowBlur = 0;

  // 绘制点边框
  ctx.strokeStyle = point.isLit ? '#FFA500' : '#666';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * 绘制线条（带渐进动画）
 */
function drawLine(ctx, line, scale) {
  const startX = line.startPoint.x * scale;
  const startY = line.startPoint.y * scale;
  const endX = line.endPoint.x * scale;
  const endY = line.endPoint.y * scale;

  // 如果是动画中的线条，使用渐进绘制
  if (line.animating) {
    const progress = line.animationProgress || 1;
    const currentEndX = startX + (endX - startX) * progress;
    const currentEndY = startY + (endY - startY) * progress;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentEndX, currentEndY);

    // 渐进线条样式（更亮）
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // 静态线条
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}
