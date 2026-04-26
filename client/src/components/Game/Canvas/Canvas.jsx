/**
 * 画布组件 - 使用 HTML5 Canvas 渲染点和线
 */

import { useEffect, useRef, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../shared/constants.js';

export function Canvas({ points, onPointClick, disabled = false }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  // 渲染画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scale = canvasSize.width / CANVAS_WIDTH;

    // 清空画布
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // 绘制背景
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // 绘制网格（可选，用于调试）
    // drawGrid(ctx, canvasSize.width, canvasSize.height);

    // 绘制所有点
    if (points && points.length > 0) {
      points.forEach((point) => {
        drawPoint(ctx, point, scale, hoveredPoint);
      });
    }
  }, [points, canvasSize, hoveredPoint]);

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
      return distance <= 10; // 10px 范围内
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
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : hoveredPoint ? 'pointer' : 'default',
          backgroundColor: '#f5f5f5',
          maxWidth: '100%',
          touchAction: 'none', // 防止移动端滚动干扰
        }}
      />
      {points && (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          共 {points.length} 个点 | 点击选择点
        </div>
      )}
    </div>
  );
}

/**
 * 绘制单个点
 */
function drawPoint(ctx, point, scale, hoveredPoint) {
  const x = point.x * scale;
  const y = point.y * scale;
  const baseRadius = 5;
  const radius = baseRadius * scale;

  // 点的样式
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  // 根据状态设置颜色
  if (point.isLit) {
    // 点亮状态：亮色
    ctx.fillStyle = '#FFD700'; // 金色
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
  } else if (hoveredPoint?.id === point.id) {
    // 悬停状态：高亮
    ctx.fillStyle = '#4CAF50'; // 绿色
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#4CAF50';
  } else {
    // 默认状态：灰色
    ctx.fillStyle = '#999';
    ctx.shadowBlur = 0;
  }

  ctx.fill();
  ctx.shadowBlur = 0; // 重置阴影

  // 绘制点边框
  ctx.strokeStyle = point.isLit ? '#FFA500' : '#666';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 绘制点 ID（可选，用于调试）
  // ctx.fillStyle = '#333';
  // ctx.font = '10px Arial';
  // ctx.textAlign = 'center';
  // ctx.fillText(point.id.slice(0, 4), x, y - radius - 5);
}

/**
 * 绘制网格（调试用）
 */
function drawGrid(ctx, width, height) {
  const gridSize = 50;
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
