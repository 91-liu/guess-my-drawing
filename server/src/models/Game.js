/**
 * Game 数据模型
 */

import { GAME_PHASES, DRAWING_TIME_LIMIT } from '../../../shared/constants.js';

export class Game {
  /**
   * 创建游戏实例
   * @param {string} roomId - 所属房间ID
   */
  constructor(roomId) {
    this.roomId = roomId;
    this.round = 1;
    this.phase = GAME_PHASES.DRAWING; // 'drawing' | 'guessing' | 'round_end'
    this.wordPool = []; // 候选词池（带ID的词汇对象）
    this.playerWords = {}; // 每个玩家的秘密词汇 { playerId: word }
    this.canvasPoints = []; // 画布上的点
    this.playerDrawings = {}; // 每个玩家的画作 { playerId: [DrawAction] }
    this.timeLeft = DRAWING_TIME_LIMIT; // 剩余时间（秒）
    this.removedWords = []; // 已移除的词汇
    this.currentGuesserIndex = 0; // 当前猜词玩家索引
    this.roundStartTime = null; // 回合开始时间
    this.createdAt = new Date().toISOString();
  }

  /**
   * 设置词汇池和分配
   * @param {Object[]} wordPool - 候选词池
   * @param {Object.<string, string>} playerWords - 玩家词汇分配
   */
  setupWords(wordPool, playerWords) {
    this.wordPool = wordPool;
    this.playerWords = playerWords;

    // 初始化玩家画作
    Object.keys(playerWords).forEach((playerId) => {
      this.playerDrawings[playerId] = [];
    });
  }

  /**
   * 设置画布点
   * @param {Object[]} points - 点数组
   */
  setupCanvas(points) {
    this.canvasPoints = points;
  }

  /**
   * 添加绘画动作
   * @param {string} playerId - 玩家ID
   * @param {Object} action - 绘画动作
   */
  addDrawAction(playerId, action) {
    if (!this.playerDrawings[playerId]) {
      this.playerDrawings[playerId] = [];
    }
    this.playerDrawings[playerId].push(action);
  }

  /**
   * 移除词汇
   * @param {string} wordId - 词汇ID
   * @param {string} playerId - 移除者ID
   * @returns {boolean} 是否成功移除
   */
  removeWord(wordId, playerId) {
    const word = this.wordPool.find((w) => w.id === wordId);
    if (!word || word.removed) {
      return false;
    }

    word.removed = true;
    word.removedBy = playerId;
    this.removedWords.push(wordId);

    return true;
  }

  /**
   * 切换到下一阶段
   */
  nextPhase() {
    if (this.phase === GAME_PHASES.DRAWING) {
      this.phase = GAME_PHASES.GUESSING;
    } else if (this.phase === GAME_PHASES.GUESSING) {
      this.phase = GAME_PHASES.ROUND_END;
    }
  }

  /**
   * 开始下一轮
   */
  nextRound() {
    this.round += 1;
    this.phase = GAME_PHASES.DRAWING;
    this.wordPool = [];
    this.playerWords = {};
    this.canvasPoints = [];
    this.playerDrawings = {};
    this.timeLeft = DRAWING_TIME_LIMIT;
    this.removedWords = [];
    this.currentGuesserIndex = 0;
    this.roundStartTime = new Date().toISOString();
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      roomId: this.roomId,
      round: this.round,
      phase: this.phase,
      wordPool: this.wordPool.filter((w) => !w.removed), // 只返回未移除的词
      canvasPoints: this.canvasPoints,
      timeLeft: this.timeLeft,
      currentGuesserIndex: this.currentGuesserIndex,
      createdAt: this.createdAt,
    };
  }
}
