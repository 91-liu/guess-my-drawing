/**
 * Socket 房间事件处理器
 */

import * as roomController from '../controllers/roomController.js';
import * as gameController from '../controllers/gameController.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { sessionManager } from '../utils/sessionManager.js';

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

      // 注册会话
      sessionManager.registerSession(socket.id, result.roomId, result.playerId);

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

      // 注册会话
      sessionManager.registerSession(socket.id, result.roomId, result.playerId);

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

      // 移除会话
      sessionManager.removeSession(socket.id);

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
   * 开始游戏事件
   */
  socket.on(SOCKET_EVENTS.START_GAME, (data, callback) => {
    try {
      console.log(`[Socket] Start game request from socket ${socket.id}`);

      const result = gameController.startGame(data.roomId);

      // 获取房间实例
      const room = roomController.getAllRooms().get(data.roomId.toUpperCase());
      if (!room) {
        throw new Error('房间不存在');
      }

      // 向每个玩家发送个人消息（包含秘密词汇）
      room.players.forEach((player) => {
        if (player.isOnline) {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit(SOCKET_EVENTS.GAME_STARTED, {
              success: true,
              secretWord: result.playerWords[player.id],
              wordPool: result.wordPool,
              canvasPoints: result.canvasPoints,
              round: 1,
            });
          }
        }
      });

      console.log(`[Socket] Game started in room ${data.roomId}`);

      // 启动绘画阶段计时器
      gameController.startDrawingTimer(data.roomId, io);

      if (callback) {
        callback({
          success: true,
          data: {
            round: 1,
            wordCount: result.wordPool.length,
            pointCount: result.canvasPoints.length,
          },
        });
      }
    } catch (error) {
      console.error('[Socket] Start game error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });

  /**
   * 断开连接处理
   */
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);

    // 获取会话信息
    const session = sessionManager.getSession(socket.id);

    if (!session) {
      console.log(`[Socket] No session found for socket ${socket.id}`);
      return;
    }

    const { roomId, playerId } = session;

    try {
      // 标记玩家为离线
      const room = roomController.getAllRooms().get(roomId);
      if (room) {
        const player = room.getPlayer(playerId);
        if (player) {
          player.setOffline();
          console.log(`[Socket] Player ${player.nickname} marked as offline`);

          // 通知房间内其他玩家
          io.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
            playerId: playerId,
            playerName: player.nickname,
            isOffline: true,
          });
        }
      }

      // 移除会话
      sessionManager.removeSession(socket.id);

      console.log(`[Socket] Disconnect handled for socket ${socket.id}`);
    } catch (error) {
      console.error('[Socket] Disconnect handling error:', error.message);
    }
  });
}
