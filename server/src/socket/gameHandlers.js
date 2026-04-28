/**
 * Socket 游戏事件处理器
 */

import * as gameController from '../controllers/gameController.js';
import * as roomController from '../controllers/roomController.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { validateDrawAction } from '../../../shared/validators.js';
import { drawActionLimiter } from '../utils/rateLimiter.js';
import { sessionManager } from '../utils/sessionManager.js';

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

      // 从 session 获取已验证的 playerId
      const session = sessionManager.getSession(socket.id);
      if (!session) {
        throw new Error('未找到会话，请重新加入房间');
      }

      const { roomId: sessionRoomId, playerId: verifiedPlayerId } = session;

      // 速率限制检查
      if (!drawActionLimiter.isAllowed(socket.id)) {
        throw new Error('操作过于频繁，请稍后再试');
      }

      const { roomId, playerId, action } = data;

      // 验证 roomId 和 playerId 匹配 session
      if (roomId.toUpperCase() !== sessionRoomId.toUpperCase()) {
        throw new Error('房间ID不匹配');
      }

      if (playerId !== verifiedPlayerId) {
        throw new Error('玩家ID不匹配');
      }

      // 验证绘画动作
      const validation = validateDrawAction(action);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 获取游戏实例
      const game = gameController.getGame(roomId);
      if (!game) {
        throw new Error('游戏不存在');
      }

      // 验证玩家存在
      const room = roomController.getAllRooms().get(roomId.toUpperCase());
      if (!room) {
        throw new Error('房间不存在');
      }

      const player = room.getPlayer(verifiedPlayerId);
      if (!player) {
        throw new Error('玩家不存在');
      }

      // 添加绘画动作到游戏
      game.addDrawAction(verifiedPlayerId, action);

      // 广播给房间内所有玩家（包括发送者）
      io.to(roomId.toUpperCase()).emit(SOCKET_EVENTS.DRAW_UPDATE, {
        action: action,
        playerId: verifiedPlayerId,
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

      const { roomId, playerId, wordId, word } = data;

      // 处理猜词
      const result = gameController.submitGuess(roomId, playerId, wordId, word);

      // 广播词汇移除事件给所有玩家
      io.to(roomId.toUpperCase()).emit(SOCKET_EVENTS.WORD_REMOVED, {
        wordId: result.wordId,
        word: result.word,
        removedBy: result.removedBy,
        isHit: result.isHit,
        // 不公布是哪个玩家被扣分（隐藏）
      });

      console.log(`[Socket] Guess submitted in room ${roomId}: ${word}`);

      if (callback) {
        callback({
          success: true,
          data: result,
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

      const { roomId } = data;

      // 结束回合
      const roundSummary = gameController.endRound(roomId);

      // 广播回合结算事件给所有玩家
      io.to(roomId.toUpperCase()).emit(SOCKET_EVENTS.ROUND_SUMMARY, roundSummary);

      console.log(`[Socket] Round ${roundSummary.round} ended in room ${roomId}`);

      if (callback) {
        callback({
          success: true,
          data: roundSummary,
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

  /**
   * 开始下一轮事件
   */
  socket.on(SOCKET_EVENTS.NEXT_ROUND, async (data, callback) => {
    try {
      console.log(`[Socket] Next round from socket ${socket.id}`);

      const { roomId } = data;

      // 启动下一轮
      const nextRoundData = await gameController.nextRound(roomId);

      // 广播新一轮开始事件给所有玩家
      io.to(roomId.toUpperCase()).emit(SOCKET_EVENTS.ROUND_STARTED, nextRoundData);

      console.log(`[Socket] Round ${nextRoundData.round} started in room ${roomId}`);

      if (callback) {
        callback({
          success: true,
          data: nextRoundData,
        });
      }
    } catch (error) {
      console.error('[Socket] Next round error:', error.message);
      if (callback) {
        callback({
          success: false,
          error: error.message,
        });
      }
    }
  });
}