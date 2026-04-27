/**
 * Socket.io 客户端服务
 */

import io from 'socket.io-client';
import { SERVER_PORT } from '@shared/constants.js';

const SERVER_URL = `http://localhost:${SERVER_PORT}`;

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
