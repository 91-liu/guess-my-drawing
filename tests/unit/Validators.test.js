/**
 * Validators 单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  validateNickname,
  validateRoomId,
  validatePlayerCount,
  validateDrawAction,
  validateGuess,
  validatePointCount,
} from '../../shared/validators.js';
import { MIN_PLAYERS, MAX_PLAYERS, ROOM_ID_LENGTH, POINT_COUNT_MIN, POINT_COUNT_MAX } from '../../shared/constants.js';

describe('Validators', () => {
  describe('validateNickname', () => {
    it('should accept valid nicknames', () => {
      expect(validateNickname('Player1')).toEqual({ valid: true });
      expect(validateNickname('测试玩家')).toEqual({ valid: true });
      expect(validateNickname('Alice')).toEqual({ valid: true });
      expect(validateNickname('Bob_123')).toEqual({ valid: true });
    });

    it('should reject empty nickname', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject whitespace only nickname', () => {
      const result = validateNickname('   ');
      expect(result.valid).toBe(false);
    });

    it('should reject too long nickname', () => {
      const longName = 'A'.repeat(21);
      const result = validateNickname(longName);
      expect(result.valid).toBe(false);
    });

    it('should accept nickname with max length', () => {
      const maxName = 'A'.repeat(20);
      expect(validateNickname(maxName)).toEqual({ valid: true });
    });

    it('should trim whitespace', () => {
      const result = validateNickname('  Player1  ');
      expect(result.valid).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateNickname(null).valid).toBe(false);
      expect(validateNickname(undefined).valid).toBe(false);
    });

    it('should reject nickname with special characters', () => {
      expect(validateNickname('Player@1').valid).toBe(false);
      expect(validateNickname('Player 1').valid).toBe(false);
    });
  });

  describe('validateRoomId', () => {
    it('should accept valid room IDs', () => {
      const validId = 'A'.repeat(ROOM_ID_LENGTH);
      expect(validateRoomId(validId)).toEqual({ valid: true });
    });

    it('should reject room ID with wrong length', () => {
      expect(validateRoomId('ABC').valid).toBe(false);
      expect(validateRoomId('ABCDEFGH').valid).toBe(false);
    });

    it('should accept uppercase and lowercase', () => {
      const result = validateRoomId('abc123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty room ID', () => {
      expect(validateRoomId('').valid).toBe(false);
    });

    it('should reject room ID with special characters', () => {
      expect(validateRoomId('ABC!@#').valid).toBe(false);
      expect(validateRoomId('ABC DEF').valid).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateRoomId(null).valid).toBe(false);
      expect(validateRoomId(undefined).valid).toBe(false);
    });
  });

  describe('validatePlayerCount', () => {
    it('should accept valid player counts', () => {
      expect(validatePlayerCount(MIN_PLAYERS)).toEqual({ valid: true });
      expect(validatePlayerCount(MAX_PLAYERS)).toEqual({ valid: true });
      expect(validatePlayerCount(5).valid).toBe(true);
    });

    it('should reject count below minimum', () => {
      expect(validatePlayerCount(MIN_PLAYERS - 1).valid).toBe(false);
      expect(validatePlayerCount(1).valid).toBe(false);
    });

    it('should reject count above maximum', () => {
      expect(validatePlayerCount(MAX_PLAYERS + 1).valid).toBe(false);
      expect(validatePlayerCount(15).valid).toBe(false);
    });

    it('should reject non-integer', () => {
      expect(validatePlayerCount(5.5).valid).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validatePlayerCount(null).valid).toBe(false);
      expect(validatePlayerCount(undefined).valid).toBe(false);
    });
  });

  describe('validateDrawAction', () => {
    it('should accept valid connect action', () => {
      const action = {
        type: 'connect',
        playerId: 'player1',
        point1: { id: 'p1', x: 100, y: 200 },
        point2: { id: 'p2', x: 300, y: 400 },
      };
      expect(validateDrawAction(action)).toEqual({ valid: true });
    });

    it('should accept valid light_up action', () => {
      const action = {
        type: 'light_up',
        playerId: 'player1',
        point: { id: 'p1', x: 100, y: 200 },
      };
      expect(validateDrawAction(action)).toEqual({ valid: true });
    });

    it('should reject invalid action type', () => {
      const action = {
        type: 'invalid',
        playerId: 'player1',
      };
      expect(validateDrawAction(action).valid).toBe(false);
    });

    it('should reject action missing playerId', () => {
      const action = {
        type: 'connect',
        point1: { id: 'p1' },
        point2: { id: 'p2' },
      };
      expect(validateDrawAction(action).valid).toBe(false);
    });

    it('should reject connect action missing points', () => {
      const action = {
        type: 'connect',
        playerId: 'player1',
      };
      expect(validateDrawAction(action).valid).toBe(false);
    });

    it('should reject light_up action missing point', () => {
      const action = {
        type: 'light_up',
        playerId: 'player1',
      };
      expect(validateDrawAction(action).valid).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateDrawAction(null).valid).toBe(false);
      expect(validateDrawAction(undefined).valid).toBe(false);
    });
  });

  describe('validateGuess', () => {
    it('should accept valid guess', () => {
      const wordPool = ['太阳', '月亮', '星星'];
      expect(validateGuess('太阳', wordPool)).toEqual({ valid: true });
    });

    it('should reject guess not in word pool', () => {
      const wordPool = ['太阳', '月亮', '星星'];
      expect(validateGuess('汽车', wordPool).valid).toBe(false);
    });

    it('should reject empty guess', () => {
      expect(validateGuess('', ['太阳']).valid).toBe(false);
    });

    it('should reject invalid word pool', () => {
      expect(validateGuess('太阳', null).valid).toBe(false);
      expect(validateGuess('太阳', 'not an array').valid).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validateGuess(null, ['太阳']).valid).toBe(false);
      expect(validateGuess(undefined, ['太阳']).valid).toBe(false);
    });
  });

  describe('validatePointCount', () => {
    it('should accept valid point counts', () => {
      expect(validatePointCount(POINT_COUNT_MIN)).toEqual({ valid: true });
      expect(validatePointCount(POINT_COUNT_MAX)).toEqual({ valid: true });
      expect(validatePointCount(17).valid).toBe(true);
    });

    it('should reject count below minimum', () => {
      expect(validatePointCount(POINT_COUNT_MIN - 1).valid).toBe(false);
      expect(validatePointCount(10).valid).toBe(false);
    });

    it('should reject count above maximum', () => {
      expect(validatePointCount(POINT_COUNT_MAX + 1).valid).toBe(false);
      expect(validatePointCount(30).valid).toBe(false);
    });

    it('should reject non-integer', () => {
      expect(validatePointCount(17.5).valid).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(validatePointCount(null).valid).toBe(false);
      expect(validatePointCount(undefined).valid).toBe(false);
    });
  });
});
