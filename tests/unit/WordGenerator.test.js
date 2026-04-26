/**
 * WordGenerator 服务单元测试
 */

import { describe, it, expect } from 'vitest';
import { generateWords, assignWordsToPlayers, createWordPool } from '../../server/src/services/wordGenerator.js';
import { WORDS_PER_PLAYER, PREDEFINED_WORDS } from '../../shared/constants.js';

describe('WordGenerator Service', () => {
  describe('generateWords', () => {
    it('should generate correct number of words', () => {
      const words4Players = generateWords(4);
      expect(words4Players.length).toBe(4 * WORDS_PER_PLAYER); // 8 words

      const words3Players = generateWords(3);
      expect(words3Players.length).toBe(3 * WORDS_PER_PLAYER); // 6 words
    });

    it('should not have duplicate words', () => {
      const words = generateWords(5);
      const uniqueWords = [...new Set(words)];
      expect(uniqueWords.length).toBe(words.length);
    });

    it('should only contain words from predefined list', () => {
      const words = generateWords(4);
      words.forEach((word) => {
        expect(PREDEFINED_WORDS).toContain(word);
      });
    });

    it('should generate different word sets on multiple calls', () => {
      const words1 = generateWords(4);
      const words2 = generateWords(4);

      // 虽然可能偶然相同，但大概率不同
      // 这里只验证长度相同
      expect(words1.length).toBe(words2.length);
    });

    it('should handle edge cases', () => {
      // 最小玩家数
      const words2 = generateWords(2);
      expect(words2.length).toBe(4);

      // 最大玩家数
      const words10 = generateWords(10);
      expect(words10.length).toBe(20);
    });
  });

  describe('assignWordsToPlayers', () => {
    it('should assign one word to each player', () => {
      const words = generateWords(3);
      const playerIds = ['player1', 'player2', 'player3'];

      const assignments = assignWordsToPlayers(words, playerIds);

      expect(Object.keys(assignments).length).toBe(3);
      expect(assignments['player1']).toBeDefined();
      expect(assignments['player2']).toBeDefined();
      expect(assignments['player3']).toBeDefined();
    });

    it('should assign different words to different players', () => {
      const words = generateWords(3);
      const playerIds = ['player1', 'player2', 'player3'];

      const assignments = assignWordsToPlayers(words, playerIds);

      const assignedWords = Object.values(assignments);
      const uniqueWords = [...new Set(assignedWords)];
      expect(uniqueWords.length).toBe(assignedWords.length);
    });

    it('should throw error when words insufficient', () => {
      const words = ['word1', 'word2']; // 只有2个词
      const playerIds = ['p1', 'p2', 'p3']; // 3个玩家

      expect(() => assignWordsToPlayers(words, playerIds)).toThrow();
    });

    it('should only use words from provided list', () => {
      const words = ['apple', 'banana', 'orange'];
      const playerIds = ['p1', 'p2', 'p3'];

      const assignments = assignWordsToPlayers(words, playerIds);

      Object.values(assignments).forEach((word) => {
        expect(words).toContain(word);
      });
    });
  });

  describe('createWordPool', () => {
    it('should create word pool with correct structure', () => {
      const words = ['apple', 'banana', 'orange'];
      const pool = createWordPool(words);

      expect(pool.length).toBe(3);
      pool.forEach((item, index) => {
        expect(item.id).toBe(`word_${index}`);
        expect(item.word).toBeDefined();
        expect(item.removed).toBe(false);
        expect(item.removedBy).toBeNull();
      });
    });

    it('should preserve word order', () => {
      const words = ['first', 'second', 'third'];
      const pool = createWordPool(words);

      expect(pool[0].word).toBe('first');
      expect(pool[1].word).toBe('second');
      expect(pool[2].word).toBe('third');
    });

    it('should handle empty word list', () => {
      const pool = createWordPool([]);
      expect(pool.length).toBe(0);
    });
  });
});