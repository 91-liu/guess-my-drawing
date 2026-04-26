/**
 * Room 模型单元测试
 */

import { describe, it, expect } from 'vitest';
import { Room } from '../../server/src/models/Room.js';
import { ROOM_ID_LENGTH, MAX_PLAYERS } from '../../shared/constants.js';

describe('Room Model', () => {
  describe('Room Creation', () => {
    it('should create a room with correct properties', () => {
      const room = new Room('Player1');

      expect(room.id).toBeDefined();
      expect(room.id.length).toBe(ROOM_ID_LENGTH);
      expect(room.players).toHaveLength(1);
      expect(room.status).toBe('waiting');
      expect(room.hostId).toBe(room.players[0].id);
    });

    it('should set the first player as host', () => {
      const room = new Room('Alice');

      const host = room.players[0];
      expect(host.isHost).toBe(true);
      expect(host.nickname).toBe('Alice');
      expect(room.hostId).toBe(host.id);
    });

    it('should generate unique room IDs', () => {
      const room1 = new Room('Player1');
      const room2 = new Room('Player2');

      expect(room1.id).not.toBe(room2.id);
    });

    it('should generate room ID with correct format', () => {
      const room = new Room('Player1');

      // 应该只包含大写字母和数字
      const pattern = /^[A-Z0-9]+$/;
      expect(room.id).toMatch(pattern);
    });
  });

  describe('Add Player', () => {
    it('should add player to room', () => {
      const room = new Room('Host');
      const newPlayer = room.addPlayer('Bob');

      expect(newPlayer).toBeDefined();
      expect(newPlayer.nickname).toBe('Bob');
      expect(newPlayer.isHost).toBe(false);
      expect(room.players).toHaveLength(2);
    });

    it('should return null when room is full', () => {
      const room = new Room('Player1');

      // 添加玩家直到满员
      for (let i = 2; i <= MAX_PLAYERS; i++) {
        room.addPlayer(`Player${i}`);
      }

      // 尝试添加第 MAX_PLAYERS + 1 个玩家
      const extraPlayer = room.addPlayer('ExtraPlayer');
      expect(extraPlayer).toBeNull();
      expect(room.players.length).toBe(MAX_PLAYERS);
    });

    it('should not allow duplicate nicknames', () => {
      const room = new Room('Alice');
      const duplicate = room.addPlayer('Alice');

      expect(duplicate).toBeNull();
      expect(room.players).toHaveLength(1);
    });

    it('should trim nickname whitespace', () => {
      const room = new Room('Host');
      const player = room.addPlayer('  Bob  ');

      expect(player.nickname).toBe('Bob');
    });
  });

  describe('Remove Player', () => {
    it('should remove player from room', () => {
      const room = new Room('Host');
      const player2 = room.addPlayer('Bob');

      const result = room.removePlayer(player2.id);

      expect(result).toBe(true);
      expect(room.players).toHaveLength(1);
    });

    it('should return false when player not found', () => {
      const room = new Room('Host');

      const result = room.removePlayer('non-existent-id');

      expect(result).toBe(false);
    });

    it('should transfer host when host leaves', () => {
      const room = new Room('Host');
      const player2 = room.addPlayer('Bob');
      const hostId = room.hostId;

      // 房主离开
      room.removePlayer(hostId);

      // 检查房主已转让
      expect(room.hostId).toBe(player2.id);
      expect(room.players[0].isHost).toBe(true);
    });

    it('should update player count after removal', () => {
      const room = new Room('Host');
      const player2 = room.addPlayer('Bob');

      room.removePlayer(player2.id);

      expect(room.players).toHaveLength(1);
    });
  });

  describe('Room Utilities', () => {
    it('should get correct player by ID', () => {
      const room = new Room('Host');
      const player2 = room.addPlayer('Bob');

      const found = room.getPlayer(player2.id);

      expect(found).toBe(player2);
    });

    it('should return undefined for non-existent player', () => {
      const room = new Room('Host');

      const found = room.getPlayer('non-existent-id');

      expect(found).toBeUndefined();
    });

    it('should check if room is empty', () => {
      const room = new Room('Host');

      expect(room.isEmpty()).toBe(false);

      room.removePlayer(room.players[0].id);

      expect(room.isEmpty()).toBe(true);
    });

    it('should count online players correctly', () => {
      const room = new Room('Host');
      const player2 = room.addPlayer('Bob');

      player2.setOffline();

      expect(room.getOnlinePlayerCount()).toBe(1);
    });
  });

  describe('Room JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const room = new Room('Host');
      const json = room.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('players');
      expect(json).toHaveProperty('hostId');
      expect(json).toHaveProperty('status');
      expect(Array.isArray(json.players)).toBe(true);
    });
  });
});
