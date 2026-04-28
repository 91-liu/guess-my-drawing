/**
 * 速率限制器 - 防止用户发送过多请求
 */

export class RateLimiter {
  /**
   * 创建速率限制器
   * @param {number} maxActions - 最大动作数
   * @param {number} windowMs - 时间窗口（毫秒）
   */
  constructor(maxActions = 10, windowMs = 1000) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
    this.requests = new Map(); // socketId -> { count, resetTime }
  }

  /**
   * 检查是否允许请求
   * @param {string} socketId - Socket ID
   * @returns {boolean} 是否允许
   */
  isAllowed(socketId) {
    const now = Date.now();
    const record = this.requests.get(socketId);

    if (!record) {
      // 首次请求
      this.requests.set(socketId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // 检查是否在时间窗口内
    if (now > record.resetTime) {
      // 重置计数器
      this.requests.set(socketId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    // 在时间窗口内，检查是否超过限制
    if (record.count >= this.maxActions) {
      return false;
    }

    // 增加计数
    record.count++;
    return true;
  }

  /**
   * 清理过期的记录
   */
  cleanup() {
    const now = Date.now();
    for (const [socketId, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(socketId);
      }
    }
  }

  /**
   * 清除指定 socket 的记录
   * @param {string} socketId - Socket ID
   */
  clear(socketId) {
    this.requests.delete(socketId);
  }
}

// 导出单例（每秒最多10个绘画动作）
export const drawActionLimiter = new RateLimiter(10, 1000);
