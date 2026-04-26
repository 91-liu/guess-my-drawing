/**
 * 数据验证器 - 前后端共享
 */

import { ROOM_ID_LENGTH, MIN_PLAYERS, MAX_PLAYERS, POINT_COUNT_MIN, POINT_COUNT_MAX } from './constants.js';

/**
 * 验证昵称
 * @param {string} nickname - 玩家昵称
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, error: '昵称不能为空' };
  }

  const trimmed = nickname.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: '昵称不能为空' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: '昵称长度不能超过20个字符' };
  }

  // 只允许中文、英文、数字、下划线
  const pattern = /^[一-龥a-zA-Z0-9_]+$/;
  if (!pattern.test(trimmed)) {
    return { valid: false, error: '昵称只能包含中文、英文、数字和下划线' };
  }

  return { valid: true };
}

/**
 * 验证房间ID
 * @param {string} roomId - 房间ID
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: '房间ID不能为空' };
  }

  const trimmed = roomId.trim().toUpperCase();

  if (trimmed.length !== ROOM_ID_LENGTH) {
    return { valid: false, error: `房间ID长度必须为${ROOM_ID_LENGTH}位` };
  }

  // 只允许大写字母和数字
  const pattern = /^[A-Z0-9]+$/;
  if (!pattern.test(trimmed)) {
    return { valid: false, error: '房间ID只能包含字母和数字' };
  }

  return { valid: true };
}

/**
 * 验证玩家数量
 * @param {number} playerCount - 玩家数量
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePlayerCount(playerCount) {
  if (!Number.isInteger(playerCount)) {
    return { valid: false, error: '玩家数量必须为整数' };
  }

  if (playerCount < MIN_PLAYERS) {
    return { valid: false, error: `至少需要${MIN_PLAYERS}名玩家` };
  }

  if (playerCount > MAX_PLAYERS) {
    return { valid: false, error: `最多支持${MAX_PLAYERS}名玩家` };
  }

  return { valid: true };
}

/**
 * 验证绘画动作
 * @param {Object} action - 绘画动作
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDrawAction(action) {
  if (!action || typeof action !== 'object') {
    return { valid: false, error: '绘画动作无效' };
  }

  if (!action.type || !action.playerId) {
    return { valid: false, error: '绘画动作缺少必要字段' };
  }

  if (action.type === 'connect') {
    if (!action.point1 || !action.point2) {
      return { valid: false, error: '连线动作必须包含两个点' };
    }
  } else if (action.type === 'light_up') {
    if (!action.point) {
      return { valid: false, error: '点亮动作必须包含一个点' };
    }
  } else {
    return { valid: false, error: '未知的绘画动作类型' };
  }

  return { valid: true };
}

/**
 * 验证猜测词汇
 * @param {string} word - 猜测的词汇
 * @param {string[]} wordPool - 候选词池
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateGuess(word, wordPool) {
  if (!word || typeof word !== 'string') {
    return { valid: false, error: '猜测词汇不能为空' };
  }

  if (!wordPool || !Array.isArray(wordPool)) {
    return { valid: false, error: '候选词池无效' };
  }

  if (!wordPool.includes(word)) {
    return { valid: false, error: '猜测词汇不在候选词池中' };
  }

  return { valid: true };
}

/**
 * 验证点数量
 * @param {number} count - 点数量
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePointCount(count) {
  if (!Number.isInteger(count)) {
    return { valid: false, error: '点数量必须为整数' };
  }

  if (count < POINT_COUNT_MIN || count > POINT_COUNT_MAX) {
    return { valid: false, error: `点数量必须在${POINT_COUNT_MIN}-${POINT_COUNT_MAX}之间` };
  }

  return { valid: true };
}
