/**
 * Canvas Generator 单元测试
 */

import { describe, it, expect } from 'vitest';
import { generateCanvasPoints } from '../../server/src/services/canvasGenerator.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, POINT_COUNT_MIN, POINT_COUNT_MAX, POINT_MIN_DISTANCE } from '../../shared/constants.js';

describe('CanvasGenerator', () => {
  describe('generateCanvasPoints', () => {
    it('should generate points with default parameters', () => {
      const points = generateCanvasPoints();

      expect(points.length).toBeGreaterThanOrEqual(POINT_COUNT_MIN);
      expect(points.length).toBeLessThanOrEqual(POINT_COUNT_MAX);
    });

    it('should generate correct number of points', () => {
      const count = 15;
      const points = generateCanvasPoints(CANVAS_WIDTH, CANVAS_HEIGHT, count);

      expect(points.length).toBe(count);
    });

    it('should generate points within canvas bounds', () => {
      const points = generateCanvasPoints();

      points.forEach((point) => {
        expect(point.x).toBeGreaterThanOrEqual(20);
        expect(point.x).toBeLessThanOrEqual(CANVAS_WIDTH - 20);
        expect(point.y).toBeGreaterThanOrEqual(20);
        expect(point.y).toBeLessThanOrEqual(CANVAS_HEIGHT - 20);
      });
    });

    it('should generate points with correct structure', () => {
      const points = generateCanvasPoints();

      points.forEach((point) => {
        expect(point).toHaveProperty('id');
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('isLit');
        expect(typeof point.id).toBe('string');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(point.isLit).toBe(false);
      });
    });

    it('should maintain minimum distance between points', () => {
      const points = generateCanvasPoints();

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const distance = Math.sqrt(
            Math.pow(points[i].x - points[j].x, 2) +
            Math.pow(points[i].y - points[j].y, 2)
          );
          expect(distance).toBeGreaterThanOrEqual(POINT_MIN_DISTANCE);
        }
      }
    });

    it('should generate unique point IDs', () => {
      const points = generateCanvasPoints();
      const ids = points.map((p) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should use custom canvas dimensions', () => {
      const customWidth = 1000;
      const customHeight = 800;
      const points = generateCanvasPoints(customWidth, customHeight);

      points.forEach((point) => {
        expect(point.x).toBeGreaterThanOrEqual(20);
        expect(point.x).toBeLessThanOrEqual(customWidth - 20);
        expect(point.y).toBeGreaterThanOrEqual(20);
        expect(point.y).toBeLessThanOrEqual(customHeight - 20);
      });
    });

    it('should handle small count parameter', () => {
      const points = generateCanvasPoints(CANVAS_WIDTH, CANVAS_HEIGHT, 5);

      expect(points.length).toBe(5);
    });

    it('should handle large count parameter', () => {
      const points = generateCanvasPoints(CANVAS_WIDTH, CANVAS_HEIGHT, 30);

      expect(points.length).toBe(30);
    });
  });
});
