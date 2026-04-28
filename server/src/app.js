/**
 * Express 应用入口
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SERVER_PORT, SOCKET_EVENTS } from '../../shared/constants.js';
import { registerRoomHandlers } from './socket/roomHandlers.js';
import { registerGameHandlers } from './socket/gameHandlers.js';
import { sessionManager } from './utils/sessionManager.js';
import { drawActionLimiter } from './utils/rateLimiter.js';
import * as roomController from './controllers/roomController.js';

const app = express();
const httpServer = createServer(app);

// CORS 配置 - 根据环境自动适配
const corsOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [])
  : ['http://localhost:5173', 'http://localhost:5174'];

console.log(`[Server] CORS allowed origins: ${corsOrigins.join(', ')}`);

// Socket.io 服务器
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 中间件
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log(`[Socket] Player connected: ${socket.id}`);

  // 注册房间事件处理器
  registerRoomHandlers(io, socket);

  // 注册游戏事件处理器
  registerGameHandlers(io, socket);

  // 测试事件
  socket.on('test_event', (data) => {
    console.log('[Socket] Test event received:', data);
    socket.emit('test_response', { message: 'Server received your message', data });
  });

  // 断开连接处理
  socket.on('disconnect', () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);

    // 清理速率限制记录
    drawActionLimiter.clear(socket.id);

    // 处理玩家离开房间
    const session = sessionManager.getSession(socket.id);
    if (session) {
      const { roomId, playerId } = session;
      console.log(`[Socket] Player ${playerId} disconnected from room ${roomId}`);

      // 标记玩家为离线（支持重连）
      const reconnectToken = sessionManager.markPlayerOffline(playerId, roomId);

      // 通知房间内其他玩家
      socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
        playerId,
        playerName: roomController.getAllRooms().get(roomId)?.getPlayer(playerId)?.nickname,
        isOffline: true,
      });

      sessionManager.removeSession(socket.id);
    }
  });
});

// 启动服务器
httpServer.listen(SERVER_PORT, () => {
  console.log(`[Server] Running on http://localhost:${SERVER_PORT}`);
  console.log(`[Server] Health check: http://localhost:${SERVER_PORT}/api/health`);
});

export { app, io };
