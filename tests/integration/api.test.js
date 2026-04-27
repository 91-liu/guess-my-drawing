/**
 * API 集成测试
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { registerRoomHandlers } from '../../server/src/socket/roomHandlers.js';
import { registerGameHandlers } from '../../server/src/socket/gameHandlers.js';

describe('API Integration Tests', () => {
  let app;
  let httpServer;
  let io;
  let clientSocket;

  beforeAll(async () => {
    return new Promise((resolve) => {
      // 创建Express应用
      app = express();
      app.use(express.json());

      // 创建HTTP服务器
      httpServer = createServer(app);
      io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });

      // 注册Socket处理器
      io.on('connection', (socket) => {
        registerRoomHandlers(io, socket);
        registerGameHandlers(io, socket);
      });

      // 健康检查端点
      app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
      });

      httpServer.listen(0, () => {
        const port = httpServer.address().port;
        clientSocket = ioClient(`http://localhost:${port}`, {
          autoConnect: false,
        });
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await request(httpServer).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Room Management', () => {
    let roomId;
    let playerId;

    beforeEach(() => {
      clientSocket.connect();
    });

    it('should create a room', (done) => {
      clientSocket.emit('create_room', { nickname: 'TestPlayer' }, (response) => {
        expect(response.success).toBe(true);
        expect(response.data).toHaveProperty('roomId');
        expect(response.data).toHaveProperty('playerId');
        expect(response.data).toHaveProperty('player');
        expect(response.data).toHaveProperty('room');

        roomId = response.data.roomId;
        playerId = response.data.playerId;

        expect(response.data.player.nickname).toBe('TestPlayer');
        expect(response.data.player.isHost).toBe(true);

        done();
      });
    });

    it('should reject empty nickname', (done) => {
      clientSocket.emit('create_room', { nickname: '' }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
        done();
      });
    });

    it('should join an existing room', (done) => {
      // 先创建一个房间
      clientSocket.emit('create_room', { nickname: 'Player1' }, (createRes) => {
        expect(createRes.success).toBe(true);
        const testRoomId = createRes.data.roomId;

        // 断开当前连接
        clientSocket.disconnect();

        // 重新连接并加入房间
        clientSocket.connect();
        clientSocket.emit('join_room', {
          roomId: testRoomId,
          nickname: 'Player2'
        }, (joinRes) => {
          expect(joinRes.success).toBe(true);
          expect(joinRes.data.roomId).toBe(testRoomId);
          expect(joinRes.data.player.nickname).toBe('Player2');
          expect(joinRes.data.player.isHost).toBe(false);
          expect(joinRes.data.room.players.length).toBe(2);

          done();
        });
      });
    });

    it('should reject invalid room ID', (done) => {
      clientSocket.emit('join_room', {
        roomId: 'INVALID',
        nickname: 'TestPlayer'
      }, (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toContain('不存在');
        done();
      });
    });

    it('should get room status', (done) => {
      clientSocket.emit('create_room', { nickname: 'TestPlayer' }, (createRes) => {
        const testRoomId = createRes.data.roomId;

        clientSocket.emit('room_status', { roomId: testRoomId }, (statusRes) => {
          expect(statusRes.success).toBe(true);
          expect(statusRes.data).toHaveProperty('roomId', testRoomId);
          expect(statusRes.data).toHaveProperty('players');
          expect(statusRes.data.players.length).toBe(1);
          done();
        });
      });
    });

    it('should leave a room', (done) => {
      clientSocket.emit('create_room', { nickname: 'TestPlayer' }, (createRes) => {
        const testRoomId = createRes.data.roomId;
        const testPlayerId = createRes.data.playerId;

        clientSocket.emit('leave_room', {
          roomId: testRoomId,
          playerId: testPlayerId
        }, (leaveRes) => {
          expect(leaveRes.success).toBe(true);
          expect(leaveRes.data.roomDeleted).toBe(true);
          done();
        });
      });
    });
  });

  describe('Game Flow', () => {
    it('should not start game with insufficient players', (done) => {
      clientSocket.emit('create_room', { nickname: 'TestPlayer' }, (createRes) => {
        const testRoomId = createRes.data.roomId;

        clientSocket.emit('start_game', { roomId: testRoomId }, (startRes) => {
          expect(startRes.success).toBe(false);
          expect(startRes.error).toContain('至少');
          done();
        });
      });
    });

    it('should start game with enough players', (done) => {
      // 创建房间并添加足够玩家
      clientSocket.emit('create_room', { nickname: 'Player1' }, (createRes) => {
        const testRoomId = createRes.data.roomId;
        const player1Id = createRes.data.playerId;

        // 使用第二个socket连接加入
        const port = httpServer.address().port;
        const player2Socket = ioClient(`http://localhost:${port}`);

        player2Socket.on('connect', () => {
          player2Socket.emit('join_room', {
            roomId: testRoomId,
            nickname: 'Player2'
          }, (joinRes) => {
            expect(joinRes.success).toBe(true);

            // 开始游戏
            clientSocket.emit('start_game', { roomId: testRoomId }, (startRes) => {
              expect(startRes.success).toBe(true);
              expect(startRes.data).toHaveProperty('round', 1);
              expect(startRes.data).toHaveProperty('wordCount');

              player2Socket.disconnect();
              done();
            });
          });
        });
      });
    });
  });

  describe('Player Events', () => {
    it('should receive player_joined event', (done) => {
      clientSocket.emit('create_room', { nickname: 'Player1' }, (createRes) => {
        const testRoomId = createRes.data.roomId;

        clientSocket.on('player_joined', (data) => {
          expect(data.player.nickname).toBe('Player2');
          expect(data.player.isHost).toBe(false);
          done();
        });

        const port = httpServer.address().port;
        const player2Socket = ioClient(`http://localhost:${port}`);

        player2Socket.on('connect', () => {
          player2Socket.emit('join_room', {
            roomId: testRoomId,
            nickname: 'Player2'
          }, (joinRes) => {
            expect(joinRes.success).toBe(true);
            player2Socket.disconnect();
          });
        });
      });
    });

    it('should receive player_left event', (done) => {
      clientSocket.emit('create_room', { nickname: 'Player1' }, (createRes) => {
        const testRoomId = createRes.data.roomId;

        const port = httpServer.address().port;
        const player2Socket = ioClient(`http://localhost:${port}`);

        player2Socket.on('connect', () => {
          player2Socket.emit('join_room', {
            roomId: testRoomId,
            nickname: 'Player2'
          }, (joinRes) => {
            expect(joinRes.success).toBe(true);
            const player2Id = joinRes.data.playerId;

            // 监听玩家离开事件
            clientSocket.on('player_left', (data) => {
              expect(data.playerId).toBe(player2Id);
              done();
            });

            // Player2离开
            player2Socket.emit('leave_room', {
              roomId: testRoomId,
              playerId: player2Id
            });
          });
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event gracefully', (done) => {
      clientSocket.emit('invalid_event', { data: 'test' }, (response) => {
        // 不应该崩溃
        expect(response).toBeUndefined();
        done();
      });
    });

    it('should handle malformed data', (done) => {
      clientSocket.emit('create_room', null, (response) => {
        expect(response.success).toBe(false);
        done();
      });
    });

    it('should handle missing parameters', (done) => {
      clientSocket.emit('join_room', {}, (response) => {
        expect(response.success).toBe(false);
        done();
      });
    });
  });
});
