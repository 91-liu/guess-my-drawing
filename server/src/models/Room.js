/**
 * Room 数据模型
 */

import { v4 as uuidv4 } from 'uuid';
import { Player } from './Player.js';
import { ROOM_ID_LENGTH, MAX_PLAYERS } from '../../../shared/constants.js';

export class Room {
  /**
   * 创建房间实例
   * @param {string} hostNickname - 房主昵称
   */
  constructor(hostNickname) {
    this.id = this.generateRoomId();
    this.players = [];
    this.hostId = null;
    this.status = 'waiting'; // 'waiting' | 'playing'
    this.currentPhase = null; // 'drawing' | 'guessing' | 'round_end'
    this.currentRound = 0;
    this.createdAt = new Date().toISOString();

    // 自动添加房主作为第一个玩家
    const host = new Player(hostNickname, true);
    this.players.push(host);
    this.hostId = host.id;

    return this;
  }

  /**
   * 生成6位房间ID
   * @returns {string} 房间ID
   */
  generateRoomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < ROOM_ID_LENGTH; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * 添加玩家到房间
   * @param {string} nickname - 玩家昵称
   * @returns {Player|null} 新玩家实例或null（如果添加失败）
   */
  addPlayer(nickname) {
    // 检查房间是否已满
    if (this.players.length >= MAX_PLAYERS) {
      return null;
    }

    // 检查昵称是否重复
    if (this.players.some((p) => p.nickname === nickname.trim())) {
      return null;
    }

    const player = new Player(nickname, false);
    this.players.push(player);
    return player;
  }

  /**
   * 移除玩家
   * @param {string} playerId - 玩家ID
   * @returns {boolean} 是否成功移除
   */
  removePlayer(playerId) {
    const index = this.players.findIndex((p) => p.id === playerId);
    if (index === -1) {
      return false;
    }

    const player = this.players[index];
    this.players.splice(index, 1);

    // 如果房主离开，转让房主
    if (player.isHost && this.players.length > 0) {
      const newHost = this.players[0];
      newHost.setAsHost();
      this.hostId = newHost.id;
    }

    return true;
  }

  /**
   * 获取玩家
   * @param {string} playerId - 玩家ID
   * @returns {Player|undefined} 玩家实例
   */
  getPlayer(playerId) {
    return this.players.find((p) => p.id === playerId);
  }

  /**
   * 获取在线玩家数量
   * @returns {number} 在线玩家数量
   */
  getOnlinePlayerCount() {
    return this.players.filter((p) => p.isOnline).length;
  }

  /**
   * 获取存活玩家数量
   * @returns {number} 存活玩家数量
   */
  getActivePlayerCount() {
    return this.players.filter((p) => !p.isEliminated && p.isOnline).length;
  }

  /**
   * 检查房间是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty() {
    return this.players.length === 0;
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      players: this.players.map((p) => p.toJSON()),
      hostId: this.hostId,
      status: this.status,
      currentPhase: this.currentPhase,
      currentRound: this.currentRound,
      createdAt: this.createdAt,
    };
  }
}
