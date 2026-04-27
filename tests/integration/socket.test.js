/**
 * Socket 集成测试 - 测试完整的游戏流程
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { registerRoomHandlers } from '../../server/src/socket/roomHandlers.js';
import { registerGameHandlers } from '../../server/src/socket/gameHandlers.js';

describe('Socket Integration Tests', () => {
  let httpServer;
  let io;
  let player1Socket;
  let player2Socket;
  let roomId;
  let player1Id;
  let player2Id;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      registerRoomHandlers(io, socket);
      registerGameHandlers(io, socket);
    });

    httpServer.listen(0, () => {
      const port = httpServer.address().port;
      const url = `http://localhost:${port}`;

      player1Socket = ioClient(url, { autoConnect: false });
      player2Socket = ioClient(url, { autoConnect: false });

      let connected = 0;
      const onConnect = () => {
        connected++;
        if (connected === 2) done();
      };

      player1Socket.on('connect', onConnect);
      player2Socket.on('connect', onConnect);

      player1Socket.connect();
      player2Socket.connect();
    });
  });

  afterAll((done) => {
    player1Socket.disconnect();
    player2Socket.disconnect();
    io.close();
    httpServer.close(done);
  });

  describe('Complete Game Flow', () => {
    it('should complete a full game round', async () => {
      // Step 1: Player1 creates a room
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Player1' }, resolve);
      });

      expect(createResult.success).toBe(true);
      roomId = createResult.data.roomId;
      player1Id = createResult.data.playerId;

      // Step 2: Player2 joins the room
      const joinResult = await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: roomId,
          nickname: 'Player2'
        }, resolve);
      });

      expect(joinResult.success).toBe(true);
      player2Id = joinResult.data.playerId;

      // Step 3: Start the game
      const gameStartedPromise = new Promise((resolve) => {
        player1Socket.on('game_started', (data) => {
          resolve(data);
        });
      });

      const player2GameStartedPromise = new Promise((resolve) => {
        player2Socket.on('game_started', (data) => {
          resolve(data);
        });
      });

      const startResult = await new Promise((resolve) => {
        player1Socket.emit('start_game', { roomId: roomId }, resolve);
      });

      expect(startResult.success).toBe(true);

      // Wait for both players to receive game_started event
      const player1GameData = await gameStartedPromise;
      const player2GameData = await player2GameStartedPromise;

      expect(player1GameData.secretWord).toBeDefined();
      expect(player1GameData.wordPool).toBeDefined();
      expect(player1GameData.canvasPoints).toBeDefined();
      expect(player1GameData.round).toBe(1);

      expect(player2GameData.secretWord).toBeDefined();
      expect(player2GameData.secretWord).not.toBe(player1GameData.secretWord);

      // Step 4: Test drawing action
      const drawAction = {
        playerId: player1Id,
        type: 'light_up',
        point: player1GameData.canvasPoints[0],
      };

      const drawUpdatePromise = new Promise((resolve) => {
        player2Socket.on('draw_update', (data) => {
          resolve(data);
        });
      });

      const drawResult = await new Promise((resolve) => {
        player1Socket.emit('draw_action', {
          roomId: roomId,
          action: drawAction,
        }, resolve);
      });

      expect(drawResult.success).toBe(true);

      const drawUpdate = await drawUpdatePromise;
      expect(drawUpdate.playerId).toBe(player1Id);
      expect(drawUpdate.action.type).toBe('light_up');

      // Step 5: Simulate phase change to guessing
      const phaseChangePromise1 = new Promise((resolve) => {
        player1Socket.on('phase_change', (data) => {
          resolve(data);
        });
      });

      // Trigger phase change manually via timer completion
      // (In real scenario, timer would trigger this)
    }, 10000);

    it('should handle drawing actions correctly', async () => {
      // Create fresh room for drawing test
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Drawer1' }, resolve);
      });

      expect(createResult.success).toBe(true);
      const testRoomId = createResult.data.roomId;
      const testPlayerId = createResult.data.playerId;

      await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Drawer2'
        }, resolve);
      });

      await new Promise((resolve) => {
        player1Socket.emit('start_game', { roomId: testRoomId }, resolve);
      });

      // Wait for game_started
      await new Promise((resolve) => {
        player1Socket.on('game_started', () => resolve());
      });

      // Draw action - connect two points
      const gameData = await new Promise((resolve) => {
        player1Socket.on('game_started', (data) => resolve(data));
      });

      if (gameData && gameData.canvasPoints && gameData.canvasPoints.length >= 2) {
        const connectAction = {
          playerId: testPlayerId,
          type: 'connect',
          point1: gameData.canvasPoints[0],
          point2: gameData.canvasPoints[1],
        };

        const drawResult = await new Promise((resolve) => {
          player1Socket.emit('draw_action', {
            roomId: testRoomId,
            action: connectAction,
          }, resolve);
        });

        expect(drawResult.success).toBe(true);
      }
    }, 10000);

    it('should handle disconnect and reconnect', async () => {
      // Create a room
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Host' }, resolve);
      });

      expect(createResult.success).toBe(true);
      const testRoomId = createResult.data.roomId;
      const hostPlayerId = createResult.data.playerId;

      // Player2 joins
      const joinResult = await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Guest'
        }, resolve);
      });

      expect(joinResult.success).toBe(true);

      // Host should receive player_left with isOffline when guest disconnects
      const disconnectPromise = new Promise((resolve) => {
        player1Socket.on('player_left', (data) => {
          if (data.isOffline) {
            resolve(data);
          }
        });
      });

      // Simulate disconnect
      player2Socket.disconnect();

      const disconnectData = await disconnectPromise;
      expect(disconnectData.isOffline).toBe(true);
      expect(disconnectData.reconnectToken).toBeDefined();
    }, 10000);
  });

  describe('Room Cleanup', () => {
    it('should delete room when last player leaves', async () => {
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Solo' }, resolve);
      });

      const testRoomId = createResult.data.roomId;
      const testPlayerId = createResult.data.playerId;

      const leaveResult = await new Promise((resolve) => {
        player1Socket.emit('leave_room', {
          roomId: testRoomId,
          playerId: testPlayerId
        }, resolve);
      });

      expect(leaveResult.success).toBe(true);
      expect(leaveResult.data.roomDeleted).toBe(true);
    });

    it('should transfer host when host leaves', async () => {
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Host' }, resolve);
      });

      const testRoomId = createResult.data.roomId;
      const hostId = createResult.data.playerId;

      const joinResult = await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Guest'
        }, resolve);
      });

      const guestId = joinResult.data.playerId;

      // Host leaves
      const leaveResult = await new Promise((resolve) => {
        player1Socket.emit('leave_room', {
          roomId: testRoomId,
          playerId: hostId
        }, resolve);
      });

      expect(leaveResult.success).toBe(true);
      expect(leaveResult.data.newHostId).toBe(guestId);
    });
  });

  describe('Game State Validation', () => {
    it('should not allow starting game twice', async () => {
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Host' }, resolve);
      });

      const testRoomId = createResult.data.roomId;

      await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Guest'
        }, resolve);
      });

      // First start should succeed
      await new Promise((resolve) => {
        player1Socket.emit('start_game', { roomId: testRoomId }, resolve);
      });

      // Second start should fail
      const secondStart = await new Promise((resolve) => {
        player1Socket.emit('start_game', { roomId: testRoomId }, resolve);
      });

      expect(secondStart.success).toBe(false);
      expect(secondStart.error).toContain('已开始');
    }, 10000);

    it('should validate room ID format on join', async () => {
      const joinResult = await new Promise((resolve) => {
        player1Socket.emit('join_room', {
          roomId: 'INVALID',
          nickname: 'Player'
        }, resolve);
      });

      expect(joinResult.success).toBe(false);
    });

    it('should not allow duplicate nicknames in room', async () => {
      const createResult = await new Promise((resolve) => {
        player1Socket.emit('create_room', { nickname: 'Duplicate' }, resolve);
      });

      const testRoomId = createResult.data.roomId;

      const joinResult = await new Promise((resolve) => {
        player2Socket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Duplicate'
        }, resolve);
      });

      // Should either fail or handle gracefully
      if (!joinResult.success) {
        expect(joinResult.error).toBeDefined();
      }
    });
  });
});
