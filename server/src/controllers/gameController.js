/**
 * 游戏控制器
 */

import { Game } from '../models/Game.js';
import * as roomController from './roomController.js';
import { generateWords, assignWordsToPlayers, createWordPool } from '../services/wordGenerator.js';
import { generateCanvasPoints } from '../services/canvasGenerator.js';
import { GameTimer } from '../utils/timer.js';
import { MIN_PLAYERS, MAX_PLAYERS, GAME_PHASES } from '../../shared/constants.js';

// 存储所有游戏实例
const games = new Map();

// 存储所有计时器实例
const timers = new Map();

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

  // 停止计时器
  const timer = timers.get(roomId.toUpperCase());
  if (timer) {
    timer.stop();
    timers.delete(roomId.toUpperCase());
  }
}

/**
 * 启动绘画阶段计时器
 * @param {string} roomId - 房间ID
 * @param {Object} io - Socket.io 服务器实例
 */
export function startDrawingTimer(roomId, io) {
  const game = getGame(roomId);
  if (!game) {
    throw new Error('游戏不存在');
  }

  // 创建计时器
  const timer = new GameTimer({
    onTick: (timeLeft) => {
      // 广播剩余时间
      io.to(roomId.toUpperCase()).emit('time_update', {
        timeLeft: timeLeft,
        phase: 'drawing',
      });

      // 时间警告（最后10秒）
      if (timeLeft <= 10) {
        io.to(roomId.toUpperCase()).emit('time_warning', {
          timeLeft: timeLeft,
        });
      }

      game.timeLeft = timeLeft;
    },
    onComplete: () => {
      console.log(`[GameController] Drawing phase completed in room ${roomId}`);

      // 广播阶段切换事件
      io.to(roomId.toUpperCase()).emit('phase_change', {
        fromPhase: 'drawing',
        toPhase: 'guessing',
        round: game.round,
      });

      // 更新游戏状态
      game.phase = GAME_PHASES.GUESSING;
    },
  });

  // 存储计时器
  timers.set(roomId.toUpperCase(), timer);

  // 启动计时器
  timer.start();

  console.log(`[GameController] Drawing timer started for room ${roomId}`);
}

/**
 * 停止计时器
 * @param {string} roomId - 房间ID
 */
export function stopTimer(roomId) {
  const timer = timers.get(roomId.toUpperCase());
  if (timer) {
    timer.stop();
    timers.delete(roomId.toUpperCase());
    console.log(`[GameController] Timer stopped for room ${roomId}`);
  }
}

/**
 * 处理猜词
 * @param {string} roomId - 房间ID
 * @param {string} playerId - 玩家ID
 * @param {string} wordId - 词汇ID
 * @param {string} word - 猜测的词汇
 * @returns {Object} 猜词结果
 */
export function submitGuess(roomId, playerId, wordId, word) {
  const game = getGame(roomId);
  if (!game) {
    throw new Error('游戏不存在');
  }

  // 检查游戏阶段
  if (game.phase !== GAME_PHASES.GUESSING) {
    throw new Error('当前不是猜词阶段');
  }

  // 查找词汇
  const wordObj = game.wordPool.find((w) => w.id === wordId);
  if (!wordObj) {
    throw new Error('词汇不存在');
  }

  if (wordObj.removed) {
    throw new Error('该词汇已被移除');
  }

  // 移除词汇
  const removed = game.removeWord(wordId, playerId);
  if (!removed) {
    throw new Error('移除词汇失败');
  }

  // 检查是否猜中了某玩家的秘密词汇
  const room = roomController.getAllRooms().get(roomId.toUpperCase());
  if (!room) {
    throw new Error('房间不存在');
  }

  let hitPlayerId = null;
  room.players.forEach((player) => {
    if (game.playerWords[player.id] === word) {
      // 猜中了该玩家的秘密词汇
      player.updateScore(-1);
      hitPlayerId = player.id;
      console.log(`[GameController] Player ${player.nickname} was hit! Secret word: ${word}, New score: ${player.score}`);
    }
  });

  console.log(`[GameController] Word removed: ${word} (by player ${playerId})`);

  return {
    wordId: wordId,
    word: word,
    removedBy: playerId,
    hitPlayerId: hitPlayerId,
    isHit: hitPlayerId !== null,
  };
}

/**
 * 结束回合
 * @param {string} roomId - 房间ID
 * @returns {Object} 回合结算数据
 */
export function endRound(roomId) {
  const game = getGame(roomId);
  if (!game) {
    throw new Error('游戏不存在');
  }

  // 检查游戏阶段
  if (game.phase !== GAME_PHASES.GUESSING) {
    throw new Error('当前不是猜词阶段');
  }

  // 获取房间
  const room = roomController.getAllRooms().get(roomId.toUpperCase());
  if (!room) {
    throw new Error('房间不存在');
  }

  // 计算本轮得分变化
  const scoreChanges = {};
  room.players.forEach((player) => {
    const previousScore = player.score;
    // 计算本轮被扣了多少分（秘密词汇被猜中的次数）
    const hitCount = game.removedWords.filter((wordId) => {
      const wordObj = game.wordPool.find((w) => w.id === wordId);
      return wordObj && game.playerWords[player.id] === wordObj.word;
    }).length;

    if (hitCount > 0) {
      scoreChanges[player.id] = -hitCount;
    }
  });

  // 更新游戏阶段
  game.phase = GAME_PHASES.ROUND_END;

  // 准备结算数据
  const roundSummary = {
    round: game.round,
    playerWords: game.playerWords,
    scoreChanges: scoreChanges,
    players: room.players.map((p) => p.toJSON()),
    gameEnded: false, // 后续会检查
  };

  console.log(`[GameController] Round ${game.round} ended in room ${roomId}`);

  return roundSummary;
}
