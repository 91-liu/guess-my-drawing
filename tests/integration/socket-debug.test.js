/**
 * Socket 集成测试调试 - 验证基础连接
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';

describe('Socket Connection Debug', () => {
  let httpServer;
  let io;
  let clientSocket;
  let serverPort;

  beforeAll(async () => {
    return new Promise((resolve, reject) => {
      httpServer = createServer();
      io = new Server(httpServer, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });

      io.on('connection', (socket) => {
        console.log('[Test] Client connected:', socket.id);
        socket.on('test_event', (data, callback) => {
          console.log('[Test] Received test_event:', data);
          callback({ success: true, received: data });
        });
      });

      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        console.log('[Test] Server listening on port:', serverPort);

        const url = `http://localhost:${serverPort}`;
        clientSocket = ioClient(url, {
          autoConnect: false,
          reconnection: false,
        });

        clientSocket.on('connect', () => {
          console.log('[Test] Client connected:', clientSocket.id);
          resolve();
        });

        clientSocket.on('connect_error', (error) => {
          console.error('[Test] Connection error:', error);
          reject(error);
        });

        clientSocket.connect();
      });
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    httpServer.close(done);
  });

  it('should establish socket connection', () => {
    expect(clientSocket).toBeDefined();
    expect(clientSocket.connected).toBe(true);
  });

  it('should send and receive events', async () => {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Event timeout'));
      }, 5000);

      clientSocket.emit('test_event', { message: 'hello' }, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });

    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.received.message).toBe('hello');
  });
});
