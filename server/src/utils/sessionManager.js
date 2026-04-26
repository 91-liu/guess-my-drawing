/**
 * Socket 会话管理器
 * 管理 socket ID 和玩家的映射关系
 */

class SocketSessionManager {
  constructor() {
    // socketId -> { roomId, playerId }
    this.sessions = new Map();
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
}

// 导出单例
export const sessionManager = new SocketSessionManager();
