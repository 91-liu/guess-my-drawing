/**
 * Express 应用入口
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SERVER_PORT } from '../../shared/constants.js';
import { registerRoomHandlers } from './socket/roomHandlers.js';

const app = express();
const httpServer = createServer(app);

// Socket.io 服务器
const io = new Server(httpServer, {
  cors: {
    origin: `http://localhost:5173`,
    methods: ['GET', 'POST'],
  },
});

// 中间件
app.use(cors());
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

  // 测试事件
  socket.on('test_event', (data) => {
    console.log('[Socket] Test event received:', data);
    socket.emit('test_response', { message: 'Server received your message', data });
  });
});

// 启动服务器
httpServer.listen(SERVER_PORT, () => {
  console.log(`[Server] Running on http://localhost:${SERVER_PORT}`);
  console.log(`[Server] Health check: http://localhost:${SERVER_PORT}/api/health`);
});

export { app, io };
