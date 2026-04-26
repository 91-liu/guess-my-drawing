/**
 * Socket 游戏事件处理器
 */

import * as gameController from '../controllers/gameController.js';
import { SOCKET_EVENTS } from '../../shared/constants.js';

/**
 * 注册游戏相关 Socket 事件
 * @param {Server} io - Socket.io 服务器实例
 * @param {Socket} socket - Socket 连接实例
 */
export function registerGameHandlers(io, socket) {
  /**
   * 绘画动作事件
   */
  socket.on(SOCKET_EVENTS.DRAW_ACTION, (data, callback) => {
    try {
      console.log(`[Socket] Draw action from socket ${socket.id}`);

      const { roomId, action } = data;

      // 获取游戏实例
      const game = gameController.getGame(roomId);
      if (!game) {
        throw new Error('游戏不存在');
      }

      // 添加绘画动作到游戏
      game.addDrawAction(action.playerId, action);

      // 广播给房间内其他玩家
      socket.to(roomId).emit(SOCKET_EVENTS.DRAW_UPDATE, {
        action: action,
        playerId: action.playerId,
      });

      console.log(`[Socket] Draw action broadcast in room ${roomId}`);

      if (callback) {
        callback({
          success: true,
        });
      }
    } catch (error) {
      console.error('[Socket] Draw action error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  /**
   * 猜词事件
   */
  socket.on(SOCKET_EVENTS.SUBMIT_GUESS, (data, callback) => {
    try {
      console.log(`[Socket] Submit guess from socket ${socket.id}`);

      // TODO: 实现猜词逻辑

      if (callback) {
        callback({
          success: true,
        });
      }
    } catch (error) {
      console.error('[Socket] Submit guess error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  /**
   * 结束回合事件
   */
  socket.on(SOCKET_EVENTS.END_TURN, (data, callback) => {
    try {
      console.log(`[Socket] End turn from socket ${socket.id}`);

      // TODO: 实现结束回合逻辑

      if (callback) {
        callback({
          success: true,
        });
      }
    } catch (error) {
      console.error('[Socket] End turn error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });
}