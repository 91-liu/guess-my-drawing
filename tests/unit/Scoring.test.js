/**
 * Scoring Engine 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../server/src/models/Player.js';
import { ROOM_ID_LENGTH } from '../../shared/constants.js';

describe('Player Scoring System', () => {
  let player;

  beforeEach(() => {
    player = new Player('TestPlayer', false);
  });

  describe('Initial Score', () => {
    it('should start with 10 points', () => {
      expect(player.score).toBe(10);
    });

    it('should not be eliminated initially', () => {
      expect(player.isEliminated).toBe(false);
    });
  });

  describe('Score Updates', () => {
    it('should deduct points correctly', () => {
      player.updateScore(-1);
      expect(player.score).toBe(9);
      expect(player.isEliminated).toBe(false);
    });

    it('should handle multiple deductions', () => {
      player.updateScore(-1);
      player.updateScore(-1);
      player.updateScore(-1);
      expect(player.score).toBe(7);
    });

    it('should eliminate player when score reaches 0', () => {
      for (let i = 0; i < 10; i++) {
        player.updateScore(-1);
      }
      expect(player.score).toBe(0);
      expect(player.isEliminated).toBe(true);
    });

    it('should not go below 0 score', () => {
      for (let i = 0; i < 15; i++) {
        player.updateScore(-1);
      }
      expect(player.score).toBe(0);
      expect(player.isEliminated).toBe(true);
    });

    it('should handle large deduction in one call', () => {
      player.updateScore(-5);
      expect(player.score).toBe(5);
      expect(player.isEliminated).toBe(false);
    });

    it('should eliminate player with large deduction', () => {
      player.updateScore(-15);
      expect(player.score).toBe(0);
      expect(player.isEliminated).toBe(true);
    });
  });

  describe('Elimination Logic', () => {
    it('should mark player as eliminated when score is 0', () => {
      expect(player.isEliminated).toBe(false);

      player.updateScore(-10);

      expect(player.score).toBe(0);
      expect(player.isEliminated).toBe(true);
    });

    it('should keep player active if score > 0', () => {
      player.updateScore(-9);

      expect(player.score).toBe(1);
      expect(player.isEliminated).toBe(false);
    });
  });

  describe('Player State', () => {
    it('should track online status', () => {
      expect(player.isOnline).toBe(true);

      player.setOffline();

      expect(player.isOnline).toBe(false);

      player.setOnline();

      expect(player.isOnline).toBe(true);
    });

    it('should track host status', () => {
      expect(player.isHost).toBe(false);

      player.setAsHost();

      expect(player.isHost).toBe(true);

      player.removeHost();

      expect(player.isHost).toBe(false);
    });

    it('should assign secret word', () => {
      expect(player.secretWord).toBeNull();

      player.assignSecretWord('太阳');

      expect(player.secretWord).toBe('太阳');
    });
  });

  describe('Drawing Actions', () => {
    it('should start with empty drawing actions', () => {
      expect(player.drawActions).toEqual([]);
    });

    it('should add drawing actions', () => {
      const action = {
        type: 'connect',
        point1: { x: 100, y: 200 },
        point2: { x: 300, y: 400 },
      };

      player.addDrawAction(action);

      expect(player.drawActions).toHaveLength(1);
      expect(player.drawActions[0]).toBe(action);
    });

    it('should clear drawing actions', () => {
      player.addDrawAction({ type: 'light_up' });
      player.addDrawAction({ type: 'connect' });

      expect(player.drawActions).toHaveLength(2);

      player.clearDrawActions();

      expect(player.drawActions).toHaveLength(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      player.assignSecretWord('月亮');
      player.updateScore(-2);

      const json = player.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('nickname', 'TestPlayer');
      expect(json).toHaveProperty('score', 8);
      expect(json).toHaveProperty('secretWord', '月亮');
      expect(json).toHaveProperty('isHost', false);
      expect(json).toHaveProperty('isOnline', true);
      expect(json).toHaveProperty('isEliminated', false);
    });
  });
});
