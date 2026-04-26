/**
 * Socket 房间事件处理器
 */

import * as roomController from '../controllers/roomController.js';
import { SOCKET_EVENTS } from '../../shared/constants.js';

/**
 * 注册房间相关 Socket 事件
 * @param {Server} io - Socket.io 服务器实例
 * @param {Socket} socket - Socket 连接实例
 */
export function registerRoomHandlers(io, socket) {
  /**
   * 创建房间事件
   */
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (data, callback) => {
    try {
      console.log(`[Socket] Create room request from socket ${socket.id}`);

      const result = roomController.createRoom(data.nickname);

      // 将玩家 socket ID 关联到玩家实例
      const room = roomController.getAllRooms().get(result.roomId);
      const player = room.getPlayer(result.playerId);
      if (player) {
        player.socketId = socket.id;
      }

      // 加入 Socket.io 房间
      socket.join(result.roomId);

      console.log(`[Socket] Room created: ${result.roomId}`);

      callback({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Socket] Create room error:', error.message);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * 加入房间事件
   */
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data, callback) => {
    try {
      console.log(`[Socket] Join room request from socket ${socket.id}`);

      const result = roomController.joinRoom(data.roomId, data.nickname);

      // 将玩家 socket ID 关联到玩家实例
      const room = roomController.getAllRooms().get(result.roomId);
      const player = room.getPlayer(result.playerId);
      if (player) {
        player.socketId = socket.id;
      }

      // 加入 Socket.io 房间
      socket.join(result.roomId);

      // 通知房间内其他玩家
      socket.to(result.roomId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
        player: result.player,
      });

      console.log(`[Socket] Player ${result.player.nickname} joined room ${result.roomId}`);

      callback({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Socket] Join room error:', error.message);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * 离开房间事件
   */
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data, callback) => {
    try {
      console.log(`[Socket] Leave room request from socket ${socket.id}`);

      const result = roomController.leaveRoom(data.roomId, data.playerId);

      // 离开 Socket.io 房间
      socket.leave(result.roomId);

      // 通知房间内其他玩家
      if (!result.roomDeleted) {
        socket.to(result.roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
          playerId: data.playerId,
          newHostId: result.newHostId,
        });
      }

      console.log(`[Socket] Player left room ${result.roomId}`);

      if (callback) {
        callback({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      console.error('[Socket] Leave room error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  /**
   * 获取房间状态事件
   */
  socket.on(SOCKET_EVENTS.ROOM_STATUS, (data, callback) => {
    try {
      const result = roomController.getRoomStatus(data.roomId);

      callback({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[Socket] Get room status error:', error.message);
      callback({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * 断开连接处理
   */
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);

    // TODO: 查找该 socket 对应的玩家，并标记为离线
    // 暂时不自动移除，等待重连机制实现
  });
}
