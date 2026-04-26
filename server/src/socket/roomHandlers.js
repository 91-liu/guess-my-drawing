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

          // 生成重连令牌
          const reconnectToken = sessionManager.markPlayerOffline(playerId, roomId);

          console.log(`[Socket] Player ${player.nickname} marked as offline, reconnect token: ${reconnectToken}`);

          // 通知房间内其他玩家
          io.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
            playerId: playerId,
            playerName: player.nickname,
            isOffline: true,
            reconnectToken: reconnectToken,
          });
        }
      }

      // 移除会话（但保留离线记录，等待重连或超时）
      sessionManager.removeSession(socket.id);

      console.log(`[Socket] Disconnect handled for socket ${socket.id}`);
    } catch (error) {
      console.error('[Socket] Disconnect handling error:', error.message);
    }
  });

  /**
   * 重连事件
   */
  socket.on(SOCKET_EVENTS.RECONNECT, (data, callback) => {
    try {
      console.log(`[Socket] Reconnect request from socket ${socket.id}`);

      const { reconnectToken } = data;

      // 尝试重连
      const reconnectInfo = sessionManager.attemptReconnect(reconnectToken);

      if (!reconnectInfo) {
        console.log(`[Socket] Reconnect failed: invalid token or timeout`);
        callback({
          success: false,
          error: '重连失败：令牌无效或已超时',
        });
        return;
      }

      const { playerId, roomId } = reconnectInfo;

      // 获取房间和玩家
      const room = roomController.getAllRooms().get(roomId);
      if (!room) {
        throw new Error('房间不存在');
      }

      const player = room.getPlayer(playerId);
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 恢复玩家状态
      player.setOnline();
      player.socketId = socket.id;

      // 注册新会话
      sessionManager.registerSession(socket.id, roomId, playerId);

      // 加入 Socket.io 房间
      socket.join(roomId);

      // 通知房间内其他玩家
      socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
        player: player.toJSON(),
        isReconnect: true,
      });

      console.log(`[Socket] Player ${player.nickname} reconnected to room ${roomId}`);

      // 获取当前游戏状态（如果正在游戏）
      let gameState = null;
      const game = gameController.getGame(roomId);
      if (game) {
        gameState = {
          gameStarted: true,
          phase: game.phase,
          round: game.round,
          secretWord: game.playerWords[playerId],
          wordPool: game.wordPool.filter((w) => !w.removed),
          canvasPoints: game.canvasPoints,
          timeLeft: game.timeLeft,
        };
      }

      callback({
        success: true,
        data: {
          roomId,
          playerId,
          player: player.toJSON(),
          room: room.toJSON(),
          gameState,
        },
      });
    } catch (error) {
      console.error('[Socket] Reconnect error:', error.message);
      callback({
        success: false,
        error: error.message,
      });
    }
  });
}
