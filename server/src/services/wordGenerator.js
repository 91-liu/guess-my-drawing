/**
 * 词汇生成服务
 */

import { PREDEFINED_WORDS, WORDS_PER_PLAYER } from '../../../shared/constants.js';
import { generateWordsWithAI } from '../config/openai.js';

/**
 * 生成词汇列表（带AI支持）
 * @param {number} playerCount - 玩家数量
 * @returns {Promise<string[]>} 词汇数组（玩家数量 × WORDS_PER_PLAYER）
 */
export async function generateWordsAsync(playerCount) {
  const totalWords = playerCount * WORDS_PER_PLAYER;

  // 尝试使用 AI 生成词汇
  const aiWords = await generateWordsWithAI(totalWords);

  if (aiWords && aiWords.length >= playerCount) {
    console.log('[WordGenerator] Using AI-generated words');
    return aiWords.slice(0, totalWords);
  }

  // 降级使用预定义词库
  console.log('[WordGenerator] Falling back to predefined words');
  return generateWords(playerCount);
}

/**
 * 生成词汇列表（同步版本，使用预定义词库）
 * @param {number} playerCount - 玩家数量
 * @returns {string[]} 词汇数组（玩家数量 × WORDS_PER_PLAYER）
 */
export function generateWords(playerCount) {
  const totalWords = playerCount * WORDS_PER_PLAYER;

  // 从预定义词库中随机选择词汇
  const shuffled = [...PREDEFINED_WORDS].sort(() => Math.random() - 0.5);

  // 取前 totalWords 个词汇
  const selectedWords = shuffled.slice(0, totalWords);

  return selectedWords;
}

/**
 * 分配词汇给玩家
 * @param {string[]} words - 词汇数组
 * @param {string[]} playerIds - 玩家ID数组
 * @returns {Object.<string, string>} 玩家ID -> 秘密词汇的映射
 */
export function assignWordsToPlayers(words, playerIds) {
  const assignments = {};

  // 确保词汇数量足够（至少等于玩家数量）
  if (words.length < playerIds.length) {
    throw new Error('词汇数量不足，无法分配给所有玩家');
  }

  // 随机打乱词汇
  const shuffledWords = [...words].sort(() => Math.random() - 0.5);

  // 为每个玩家分配一个词汇
  playerIds.forEach((playerId, index) => {
    assignments[playerId] = shuffledWords[index];
  });

  return assignments;
}

/**
 * 创建候选词池（所有词汇）
 * @param {string[]} words - 词汇数组
 * @returns {Object[]} 带ID的词汇对象数组
 */
export function createWordPool(words) {
  return words.map((word, index) => ({
    id: `word_${index}`,
    word: word,
    removed: false,
    removedBy: null,
  }));
}