/**
 * 画布生成服务
 */

import { v4 as uuidv4 } from 'uuid';
import { CANVAS_WIDTH, CANVAS_HEIGHT, POINT_COUNT_MIN, POINT_COUNT_MAX, POINT_MIN_DISTANCE } from '../../../shared/constants.js';

/**
 * 生成画布上的随机点
 * @param {number} width - 画布宽度（默认 CANVAS_WIDTH）
 * @param {number} height - 画布高度（默认 CANVAS_HEIGHT）
 * @param {number} count - 点数量（默认随机15-20）
 * @returns {Object[]} 点数组
 */
export function generateCanvasPoints(width = CANVAS_WIDTH, height = CANVAS_HEIGHT, count = null) {
  // 随机生成点数量（15-20个）
  const pointCount = count || Math.floor(Math.random() * (POINT_COUNT_MAX - POINT_COUNT_MIN + 1)) + POINT_COUNT_MIN;

  const points = [];
  const minDistance = POINT_MIN_DISTANCE;

  while (points.length < pointCount) {
    // 生成随机坐标，避免边缘（留20px边距）
    const x = Math.floor(Math.random() * (width - 40)) + 20;
    const y = Math.floor(Math.random() * (height - 40)) + 20;

    // 检查与现有点的距离
    const tooClose = points.some((p) => {
      const distance = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
      return distance < minDistance;
    });

    if (!tooClose) {
      points.push({
        id: uuidv4(),
        x: x,
        y: y,
        isLit: false,
      });
    }
  }

  console.log(`[CanvasGenerator] Generated ${points.length} points`);

  return points;
}

/**
 * 验证点的分布是否均匀
 * @param {Object[]} points - 点数组
 * @returns {boolean} 是否分布均匀
 */
export function validatePointDistribution(points) {
  if (points.length === 0) return false;

  // 检查所有点之间的最小距离
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const distance = Math.sqrt(
        Math.pow(points[i].x - points[j].x, 2) + Math.pow(points[i].y - points[j].y, 2)
      );
      if (distance < POINT_MIN_DISTANCE) {
        return false;
      }
    }
  }

  return true;
}