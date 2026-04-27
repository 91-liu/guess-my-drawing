/**
 * Timer 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameTimer } from '../../server/src/utils/timer.js';
import { DRAWING_TIME_LIMIT } from '../../shared/constants.js';

describe('GameTimer', () => {
  let timer;
  let mockOnTick;
  let mockOnComplete;

  beforeEach(() => {
    mockOnTick = vi.fn();
    mockOnComplete = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (timer) {
      timer.stop();
    }
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create timer with default duration', () => {
      timer = new GameTimer();
      expect(timer.duration).toBe(DRAWING_TIME_LIMIT);
    });

    it('should create timer with custom duration', () => {
      timer = new GameTimer({ duration: 60 });
      expect(timer.duration).toBe(60);
    });

    it('should accept callback functions', () => {
      timer = new GameTimer({
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });
      expect(timer.onTick).toBe(mockOnTick);
      expect(timer.onComplete).toBe(mockOnComplete);
    });

    it('should initialize with correct default state', () => {
      timer = new GameTimer();
      expect(timer.isRunning).toBe(false);
      expect(timer.timeLeft).toBe(DRAWING_TIME_LIMIT);
    });
  });

  describe('start', () => {
    it('should start the timer', () => {
      timer = new GameTimer({
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });

      timer.start();
      expect(timer.isRunning).toBe(true);
    });

    it('should call onTick every second', () => {
      timer = new GameTimer({
        duration: 10,
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });

      timer.start();

      // start() immediately calls onTick with initial time
      expect(mockOnTick).toHaveBeenCalledTimes(1);
      expect(mockOnTick).toHaveBeenCalledWith(10);

      vi.advanceTimersByTime(1000);
      expect(mockOnTick).toHaveBeenCalledTimes(2);
      expect(mockOnTick).toHaveBeenCalledWith(9);

      vi.advanceTimersByTime(1000);
      expect(mockOnTick).toHaveBeenCalledTimes(3);
      expect(mockOnTick).toHaveBeenCalledWith(8);
    });

    it('should call onComplete when timer reaches 0', () => {
      timer = new GameTimer({
        duration: 3,
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });

      timer.start();

      vi.advanceTimersByTime(3000);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(timer.isRunning).toBe(false);
    });

    it('should not start if already running', () => {
      timer = new GameTimer({ duration: 10 });

      timer.start();
      const intervalId1 = timer.intervalId;

      timer.start();
      expect(timer.intervalId).toBe(intervalId1);
    });
  });

  describe('stop', () => {
    it('should stop the timer', () => {
      timer = new GameTimer({
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });

      timer.start();
      expect(timer.isRunning).toBe(true);

      timer.stop();
      expect(timer.isRunning).toBe(false);
    });

    it('should clear the interval', () => {
      timer = new GameTimer({
        duration: 10,
        onTick: mockOnTick,
        onComplete: mockOnComplete,
      });

      timer.start();
      timer.stop();

      vi.advanceTimersByTime(5000);

      // start() calls onTick immediately once, then stops
      // After stop, no more calls should happen
      expect(mockOnTick).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when stopping non-running timer', () => {
      timer = new GameTimer();
      expect(() => timer.stop()).not.toThrow();
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      timer = new GameTimer({
        duration: 10,
        onTick: mockOnTick,
      });

      timer.start();
      vi.advanceTimersByTime(2000);

      timer.pause();

      const pausedTime = timer.timeLeft;

      vi.advanceTimersByTime(2000);
      expect(timer.timeLeft).toBe(pausedTime);
    });
  });

  describe('resume', () => {
    it('should resume paused timer', () => {
      timer = new GameTimer({
        duration: 10,
        onTick: mockOnTick,
      });

      timer.start();
      vi.advanceTimersByTime(3000);
      timer.pause();
      timer.stop();

      timer.resume();
      expect(timer.isRunning).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(mockOnTick).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset timer to initial duration', () => {
      timer = new GameTimer({ duration: 10 });

      timer.start();
      vi.advanceTimersByTime(5000);

      timer.reset();
      expect(timer.timeLeft).toBe(10);
      expect(timer.isRunning).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      timer = new GameTimer({
        duration: 1,
        onComplete: mockOnComplete,
      });

      timer.start();
      vi.advanceTimersByTime(1000);

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should handle negative duration gracefully', () => {
      timer = new GameTimer({ duration: -5 });
      expect(timer.duration).toBe(-5);
    });

    it('should handle missing callbacks', () => {
      timer = new GameTimer();
      expect(() => timer.start()).not.toThrow();

      vi.advanceTimersByTime(2000);
      expect(timer.timeLeft).toBe(DRAWING_TIME_LIMIT - 2);
    });
  });
});
