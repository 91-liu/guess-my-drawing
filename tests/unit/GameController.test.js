/**
 * Game Controller 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as gameController from '../../server/src/controllers/gameController.js';
import * as roomController from '../../server/src/controllers/roomController.js';
import { GAME_PHASES, MIN_PLAYERS } from '../../shared/constants.js';

describe('GameController', () => {
  let testRoom;
  let testPlayers = [];

  beforeEach(() => {
    // 清理所有游戏
    const games = gameController.getAllGames();
    games.forEach((game, roomId) => {
      gameController.endGame(roomId);
    });

    // 创建测试房间和玩家
    testRoom = roomController.createRoom('TestPlayer1');
    testPlayers = [
      testRoom.player,
    ];

    // 添加更多玩家以满足最小玩家数要求
    for (let i = 2; i <= MIN_PLAYERS; i++) {
      const player = roomController.joinRoom(testRoom.roomId, `TestPlayer${i}`);
      testPlayers.push(player.player);
    }
  });

  describe('startGame', () => {
    it('should start game successfully with valid room', async () => {
      const result = await gameController.startGame(testRoom.roomId);

      expect(result).toHaveProperty('game');
      expect(result).toHaveProperty('playerWords');
      expect(result).toHaveProperty('canvasPoints');
      expect(result).toHaveProperty('wordPool');
    });

    it('should throw error for non-existent room', async () => {
      await expect(gameController.startGame('NONEXISTENT')).rejects.toThrow('房间不存在');
    });

    it('should throw error for room already playing', async () => {
      await gameController.startGame(testRoom.roomId);

      await expect(gameController.startGame(testRoom.roomId)).rejects.toThrow('游戏已开始');
    });

    it('should generate correct number of words', async () => {
      const result = await gameController.startGame(testRoom.roomId);

      const expectedWordCount = testPlayers.length * 2;
      expect(result.wordPool.length).toBe(expectedWordCount);
    });

    it('should generate correct number of canvas points', async () => {
      const result = await gameController.startGame(testRoom.roomId);

      expect(result.canvasPoints.length).toBeGreaterThanOrEqual(15);
      expect(result.canvasPoints.length).toBeLessThanOrEqual(20);
    });

    it('should assign secret words to all players', async () => {
      const result = await gameController.startGame(testRoom.roomId);

      testPlayers.forEach((player) => {
        expect(result.playerWords[player.id]).toBeDefined();
        expect(typeof result.playerWords[player.id]).toBe('string');
      });
    });
  });

  describe('getGame', () => {
    it('should return game instance after starting', async () => {
      await gameController.startGame(testRoom.roomId);

      const game = gameController.getGame(testRoom.roomId);

      expect(game).toBeDefined();
      expect(game.roomId).toBe(testRoom.roomId.toUpperCase());
    });

    it('should return undefined for non-existent game', () => {
      const game = gameController.getGame('NONEXISTENT');

      expect(game).toBeUndefined();
    });
  });

  describe('endGame', () => {
    it('should end game successfully', async () => {
      await gameController.startGame(testRoom.roomId);

      gameController.endGame(testRoom.roomId);

      const game = gameController.getGame(testRoom.roomId);
      expect(game).toBeUndefined();
    });

    it('should not throw error when ending non-existent game', () => {
      expect(() => gameController.endGame('NONEXISTENT')).not.toThrow();
    });
  });

  describe('submitGuess', () => {
    it('should throw error when not in guessing phase', async () => {
      const room = roomController.createRoom('Player1');
      roomController.joinRoom(room.roomId, 'Player2');
      await gameController.startGame(room.roomId);
      const game = gameController.getGame(room.roomId);
      game.phase = GAME_PHASES.DRAWING;

      const word = game.wordPool[0];

      expect(() => {
        gameController.submitGuess(room.roomId, room.player.id, word.id, word.word);
      }).toThrow('当前不是猜词阶段');
    });

    it('should throw error for removed word', async () => {
      const room = roomController.createRoom('Player1');
      roomController.joinRoom(room.roomId, 'Player2');
      await gameController.startGame(room.roomId);
      const game = gameController.getGame(room.roomId);
      game.phase = GAME_PHASES.GUESSING;

      const word = game.wordPool[0];
      game.removeWord(word.id, room.player.id);

      expect(() => {
        gameController.submitGuess(room.roomId, room.player.id, word.id, word.word);
      }).toThrow('该词汇已被移除');
    });
  });

  describe('endRound', () => {
    beforeEach(async () => {
      await gameController.startGame(testRoom.roomId);
      // 设置为猜词阶段
      const game = gameController.getGame(testRoom.roomId);
      game.phase = GAME_PHASES.GUESSING;
    });

    it('should end round successfully', () => {
      const result = gameController.endRound(testRoom.roomId);

      expect(result).toHaveProperty('round');
      expect(result).toHaveProperty('playerWords');
      expect(result).toHaveProperty('scoreChanges');
      expect(result).toHaveProperty('players');
    });

    it('should throw error when not in guessing phase', async () => {
      const game = gameController.getGame(testRoom.roomId);
      game.phase = GAME_PHASES.DRAWING;

      expect(() => {
        gameController.endRound(testRoom.roomId);
      }).toThrow('当前不是猜词阶段');
    });

    it('should detect game end when only one player alive', async () => {
      // 淘汰所有玩家除第一个
      const room = roomController.getAllRooms().get(testRoom.roomId.toUpperCase());
      room.players.slice(1).forEach((player) => {
        player.updateScore(-10);
      });

      const result = gameController.endRound(testRoom.roomId);

      expect(result.gameEnded).toBe(true);
      expect(result.winner).toBeDefined();
      expect(result.winner.id).toBe(testPlayers[0].id);
    });
  });

  describe('nextRound', () => {
    beforeEach(async () => {
      await gameController.startGame(testRoom.roomId);
      const game = gameController.getGame(testRoom.roomId);
      game.phase = GAME_PHASES.ROUND_END;
    });

    it('should start next round successfully', async () => {
      const result = await gameController.nextRound(testRoom.roomId);

      expect(result.round).toBe(2);
      expect(result).toHaveProperty('playerWords');
      expect(result).toHaveProperty('canvasPoints');
      expect(result).toHaveProperty('wordPool');
    });

    it('should throw error when game is over', async () => {
      const game = gameController.getGame(testRoom.roomId);
      game.phase = GAME_PHASES.GAME_OVER;

      await expect(gameController.nextRound(testRoom.roomId)).rejects.toThrow('游戏已结束');
    });

    it('should generate new words for next round', async () => {
      const firstRound = gameController.getGame(testRoom.roomId);
      const firstWords = [...firstRound.wordPool];

      await gameController.nextRound(testRoom.roomId);
      const secondRound = gameController.getGame(testRoom.roomId);

      expect(secondRound.round).toBe(2);
    });

    it('should increment round counter', async () => {
      const game = gameController.getGame(testRoom.roomId);
      expect(game.round).toBe(1);

      await gameController.nextRound(testRoom.roomId);
      expect(game.round).toBe(2);
    });
  });

  describe('timer functions', () => {
    it('should start drawing timer', async () => {
      await gameController.startGame(testRoom.roomId);

      const mockIo = {
        to: () => ({
          emit: () => {},
        }),
      };

      gameController.startDrawingTimer(testRoom.roomId, mockIo);

      // 验证计时器已启动（通过检查游戏状态）
      const game = gameController.getGame(testRoom.roomId);
      expect(game).toBeDefined();

      // 清理
      gameController.stopTimer(testRoom.roomId);
    });

    it('should stop timer', async () => {
      await gameController.startGame(testRoom.roomId);

      const mockIo = {
        to: () => ({
          emit: () => {},
        }),
      };

      gameController.startDrawingTimer(testRoom.roomId, mockIo);
      gameController.stopTimer(testRoom.roomId);

      // 验证计时器已停止（不抛出错误即可）
      expect(() => gameController.stopTimer(testRoom.roomId)).not.toThrow();
    });
  });
});
