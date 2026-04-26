/**
 * 计时器服务
 */

import { DRAWING_TIME_LIMIT } from '../../../shared/constants.js';

export class GameTimer {
  /**
   * 创建计时器实例
   * @param {Object} options - 配置选项
   * @param {number} options.duration - 计时时长（秒）
   * @param {Function} options.onTick - 每秒回调
   * @param {Function} options.onComplete - 完成回调
   */
  constructor(options = {}) {
    this.duration = options.duration || DRAWING_TIME_LIMIT;
    this.timeLeft = this.duration;
    this.onTick = options.onTick;
    this.onComplete = options.onComplete;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * 启动计时器
   */
  start() {
    if (this.isRunning) {
      console.warn('[GameTimer] Timer already running');
      return;
    }

    this.isRunning = true;
    this.timeLeft = this.duration;

    console.log(`[GameTimer] Timer started: ${this.duration}s`);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    // 立即发送初始时间
    if (this.onTick) {
      this.onTick(this.timeLeft);
    }
  }

  /**
   * 每秒触发
   */
  tick() {
    this.timeLeft -= 1;

    // 回调
    if (this.onTick) {
      this.onTick(this.timeLeft);
    }

    // 时间到
    if (this.timeLeft <= 0) {
      this.stop();
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  /**
   * 停止计时器
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[GameTimer] Timer stopped');
  }

  /**
   * 暂停计时器
   */
  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log(`[GameTimer] Timer paused at ${this.timeLeft}s`);
  }

  /**
   * 恢复计时器
   */
  resume() {
    if (this.isRunning) {
      console.warn('[GameTimer] Timer already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    console.log(`[GameTimer] Timer resumed at ${this.timeLeft}s`);
  }

  /**
   * 重置计时器
   */
  reset() {
    this.stop();
    this.timeLeft = this.duration;
    console.log('[GameTimer] Timer reset');
  }

  /**
   * 获取剩余时间
   */
  getTimeLeft() {
    return this.timeLeft;
  }

  /**
   * 检查是否在运行
   */
  isActive() {
    return this.isRunning;
  }
}
