/**
 * Socket 会话管理器
 * 管理 socket ID 和玩家的映射关系，支持断线重连
 */

class SocketSessionManager {
  constructor() {
    // socketId -> { roomId, playerId }
    this.sessions = new Map();

    // playerId -> { roomId, lastDisconnectTime, reconnectToken }
    this.offlinePlayers = new Map();

    // 断线超时时间（毫秒）
    this.DISCONNECT_TIMEOUT = 60000; // 60秒
  }

  /**
   * 注册会话
   * @param {string} socketId - Socket ID
   * @param {string} roomId - 房间ID
   * @param {string} playerId - 玩家ID
   */
  registerSession(socketId, roomId, playerId) {
    this.sessions.set(socketId, { roomId, playerId });
    console.log(`[SessionManager] Session registered: ${socketId} -> Room: ${roomId}, Player: ${playerId}`);
  }

  /**
   * 获取会话信息
   * @param {string} socketId - Socket ID
   * @returns {Object|null} 会话信息
   */
  getSession(socketId) {
    return this.sessions.get(socketId) || null;
  }

  /**
   * 移除会话
   * @param {string} socketId - Socket ID
   * @returns {Object|null} 被移除的会话信息
   */
  removeSession(socketId) {
    const session = this.sessions.get(socketId);
    if (session) {
      this.sessions.delete(socketId);
      console.log(`[SessionManager] Session removed: ${socketId}`);
    }
    return session;
  }

  /**
   * 查找房间内的所有socket ID
   * @param {string} roomId - 房间ID
   * @returns {Array<string>} Socket ID列表
   */
  getRoomSockets(roomId) {
    const sockets = [];
    this.sessions.forEach((session, socketId) => {
      if (session.roomId === roomId) {
        sockets.push(socketId);
      }
    });
    return sockets;
  }

  /**
   * 查找玩家的socket ID
   * @param {string} playerId - 玩家ID
   * @returns {string|null} Socket ID
   */
  getPlayerSocket(playerId) {
    for (const [socketId, session] of this.sessions.entries()) {
      if (session.playerId === playerId) {
        return socketId;
      }
    }
    return null;
  }

  /**
   * 标记玩家为离线（断线）
   * @param {string} playerId - 玩家ID
   * @param {string} roomId - 房间ID
   */
  markPlayerOffline(playerId, roomId) {
    const reconnectToken = this.generateReconnectToken();
    this.offlinePlayers.set(playerId, {
      roomId,
      lastDisconnectTime: Date.now(),
      reconnectToken,
    });

    console.log(`[SessionManager] Player ${playerId} marked as offline in room ${roomId}`);
    console.log(`[SessionManager] Reconnect token: ${reconnectToken}`);

    // 设置超时自动移除
    setTimeout(() => {
      this.checkOfflineTimeout(playerId);
    }, this.DISCONNECT_TIMEOUT);

    return reconnectToken;
  }

  /**
   * 检查离线玩家是否超时
   * @param {string} playerId - 玩家ID
   */
  checkOfflineTimeout(playerId) {
    const offlineInfo = this.offlinePlayers.get(playerId);
    if (!offlineInfo) return;

    const timeSinceDisconnect = Date.now() - offlineInfo.lastDisconnectTime;
    if (timeSinceDisconnect >= this.DISCONNECT_TIMEOUT) {
      console.log(`[SessionManager] Player ${playerId} offline timeout (${timeSinceDisconnect}ms)`);
      this.offlinePlayers.delete(playerId);
      // 返回房间ID，由调用者处理移除逻辑
      return offlineInfo.roomId;
    }

    return null;
  }

  /**
   * 尝试重连
   * @param {string} reconnectToken - 重连令牌
   * @returns {Object|null} 重连信息 { playerId, roomId }
   */
  attemptReconnect(reconnectToken) {
    for (const [playerId, info] of this.offlinePlayers.entries()) {
      if (info.reconnectToken === reconnectToken) {
        // 检查是否超时
        const timeSinceDisconnect = Date.now() - info.lastDisconnectTime;
        if (timeSinceDisconnect < this.DISCONNECT_TIMEOUT) {
          // 重连成功，清除离线记录
          this.offlinePlayers.delete(playerId);
          console.log(`[SessionManager] Player ${playerId} reconnected to room ${info.roomId}`);
          return {
            playerId,
            roomId: info.roomId,
          };
        }
      }
    }
    return null;
  }

  /**
   * 生成重连令牌
   * @returns {string} 重连令牌
   */
  generateReconnectToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 清除玩家的离线记录
   * @param {string} playerId - 玩家ID
   */
  clearOfflineRecord(playerId) {
    this.offlinePlayers.delete(playerId);
    console.log(`[SessionManager] Offline record cleared for player ${playerId}`);
  }
}

// 导出单例
export const sessionManager = new SocketSessionManager();
