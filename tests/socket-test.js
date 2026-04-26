/**
 * Socket.io 双向通信测试脚本
 */

import io from 'socket.io-client';
import { SOCKET_EVENTS } from '../shared/constants.js';

const SERVER_URL = 'http://localhost:3000';

console.log('[Test] Starting Socket.io client test...');
console.log(`[Test] Connecting to ${SERVER_URL}`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
});

// 连接成功
socket.on(SOCKET_EVENTS.CONNECT, () => {
  console.log(`\n✅ [Test] Connected successfully! Socket ID: ${socket.id}`);

  // 测试发送消息
  console.log('\n📤 [Test] Sending test_event...');
  socket.emit(SOCKET_EVENTS.TEST_EVENT, {
    message: 'Hello from test client!',
    timestamp: Date.now(),
  });
});

// 接收测试响应
socket.on(SOCKET_EVENTS.TEST_RESPONSE, (data) => {
  console.log('\n✅ [Test] Received test_response:');
  console.log(JSON.stringify(data, null, 2));

  // 验证消息内容
  if (data.message && data.data) {
    console.log('\n✅ [Test] Message content verified!');
    console.log('\n🎉 [Test] Socket bidirectional communication test PASSED!');

    // 断开连接
    console.log('\n📤 [Test] Disconnecting...');
    socket.disconnect();
  } else {
    console.error('\n❌ [Test] Invalid message format');
    process.exit(1);
  }
});

// 连接错误
socket.on('connect_error', (error) => {
  console.error('\n❌ [Test] Connection error:', error.message);
  console.error('\n❌ [Test] Make sure server is running: npm run server');
  process.exit(1);
});

// 断开连接
socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
  console.log(`\n✅ [Test] Disconnected. Reason: ${reason}`);
  console.log('\n✅ [Test] All tests passed! Socket.io bidirectional communication working correctly.');
  process.exit(0);
});

// 超时检查
setTimeout(() => {
  console.error('\n❌ [Test] Test timeout - no response received');
  console.error('\n❌ [Test] Check if server is running and Socket.io is configured correctly');
  socket.disconnect();
  process.exit(1);
}, 10000);
