/**
 * 游戏控制器
 */

import { Game } from '../models/Game.js';
import * as roomController from './roomController.js';
import { generateWords, assignWordsToPlayers, createWordPool } from '../services/wordGenerator.js';
import { generateCanvasPoints } from '../services/canvasGenerator.js';
import { MIN_PLAYERS, MAX_PLAYERS, GAME_PHASES } from '../../shared/constants.js';

// 存储所有游戏实例
const games = new Map();

/**
 * 启动游戏
 * @param {string} roomId - 房间ID
 * @returns {Object} 游戏初始化数据
 */
export function startGame(roomId) {
  const room = roomController.getAllRooms().get(roomId.toUpperCase());

  if (!room) {
    throw new Error('房间不存在');
  }

  // 检查房间状态
  if (room.status !== 'waiting') {
    throw new Error('游戏已开始');
  }

  // 检查玩家数量
  const onlinePlayers = room.players.filter((p) => p.isOnline && !p.isEliminated);
  if (onlinePlayers.length < MIN_PLAYERS) {
    throw new Error(`至少需要${MIN_PLAYERS}名玩家`);
  }

  if (onlinePlayers.length > MAX_PLAYERS) {
    throw new Error(`最多支持${MAX_PLAYERS}名玩家`);
  }

  // 更新房间状态
  room.status = 'playing';
  room.currentPhase = GAME_PHASES.DRAWING;
  room.currentRound = 1;

  // 生成词汇
  const words = generateWords(onlinePlayers.length);
  const playerIds = onlinePlayers.map((p) => p.id);
  const playerWordAssignments = assignWordsToPlayers(words, playerIds);

  // 分配秘密词汇给玩家
  onlinePlayers.forEach((player) => {
    player.assignSecretWord(playerWordAssignments[player.id]);
    player.clearDrawActions();
  });

  // 创建候选词池
  const wordPool = createWordPool(words);

  // 生成画布点
  const canvasPoints = generateCanvasPoints();

  // 创建游戏实例
  const game = new Game(roomId);
  game.setupWords(wordPool, playerWordAssignments);
  game.setupCanvas(canvasPoints);
  game.roundStartTime = new Date().toISOString();

  // 存储游戏
  games.set(roomId.toUpperCase(), game);

  console.log(`[GameController] Game started in room ${roomId}`);
  console.log(`[GameController] Players: ${onlinePlayers.map((p) => p.nickname).join(', ')}`);
  console.log(`[GameController] Words generated: ${words.length}`);

  return {
    game: game.toJSON(),
    playerWords: playerWordAssignments,
    canvasPoints: canvasPoints,
    wordPool: wordPool.filter((w) => !w.removed), // 只返回未移除的词
  };
}

/**
 * 获取游戏实例
 * @param {string} roomId - 房间ID
 * @returns {Game|undefined} 游戏实例
 */
export function getGame(roomId) {
  return games.get(roomId.toUpperCase());
}

/**
 * 获取所有游戏
 * @returns {Map} 游戏映射
 */
export function getAllGames() {
  return games;
}

/**
 * 结束游戏
 * @param {string} roomId - 房间ID
 */
export function endGame(roomId) {
  const game = games.get(roomId.toUpperCase());
  if (game) {
    games.delete(roomId.toUpperCase());
    console.log(`[GameController] Game ended in room ${roomId}`);
  }
}
