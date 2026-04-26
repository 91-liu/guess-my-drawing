/**
 * Socket 游戏事件处理器
 */

import * as gameController from '../controllers/gameController.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

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
  socket.on(SOCKET_EVENTS.NEXT_ROUND, (data, callback) => {
    try {
      console.log(`[Socket] Next round from socket ${socket.id}`);

      const { roomId } = data;

      // 启动下一轮
      const nextRoundData = gameController.nextRound(roomId);

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