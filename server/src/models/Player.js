/**
 * Player 数据模型
 */

import { v4 as uuidv4 } from 'uuid';

export class Player {
  /**
   * 创建玩家实例
   * @param {string} nickname - 玩家昵称
   * @param {boolean} isHost - 是否为房主
   */
  constructor(nickname, isHost = false) {
    this.id = uuidv4();
    this.nickname = nickname.trim();
    this.score = 10; // 初始分数
    this.secretWord = null; // 游戏开始后分配
    this.isHost = isHost;
    this.isOnline = true;
    this.isEliminated = false;
    this.drawActions = []; // 该玩家的绘画动作
    this.socketId = null; // Socket连接ID
    this.joinedAt = new Date().toISOString();
  }

  /**
   * 更新玩家分数
   * @param {number} change - 分数变化（负数为扣分）
   */
  updateScore(change) {
    this.score += change;
    if (this.score <= 0) {
      this.score = 0;
      this.isEliminated = true;
    }
  }

  /**
   * 设置玩家为房主
   */
  setAsHost() {
    this.isHost = true;
  }

  /**
   * 移除房主身份
   */
  removeHost() {
    this.isHost = false;
  }

  /**
   * 设置玩家离线
   */
  setOffline() {
    this.isOnline = false;
  }

  /**
   * 设置玩家在线
   */
  setOnline() {
    this.isOnline = true;
  }

  /**
   * 分配秘密词汇
   * @param {string} word - 词汇
   */
  assignSecretWord(word) {
    this.secretWord = word;
  }

  /**
   * 添加绘画动作
   * @param {Object} action - 绘画动作
   */
  addDrawAction(action) {
    this.drawActions.push(action);
  }

  /**
   * 清空绘画动作
   */
  clearDrawActions() {
    this.drawActions = [];
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      nickname: this.nickname,
      score: this.score,
      secretWord: this.secretWord,
      isHost: this.isHost,
      isOnline: this.isOnline,
      isEliminated: this.isEliminated,
      joinedAt: this.joinedAt,
    };
  }
}
