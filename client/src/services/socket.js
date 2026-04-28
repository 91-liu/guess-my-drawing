/**
 * Socket.io 客户端服务
 */

import io from 'socket.io-client';

// 根据环境动态选择服务器地址
const SERVER_URL = import.meta.env.VITE_SOCKET_URL ||
                   import.meta.env.VITE_API_URL ||
                   'http://localhost:3000';

console.log('[SocketService] Connecting to:', SERVER_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * 连接到服务器
   */
  connect() {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected from server');
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * 获取 Socket 实例
   */
  getSocket() {
    if (!this.socket) {
      this.connect();
    }
    return this.socket;
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// 导出单例
export const socketService = new SocketService();
