/**
 * 应用根组件 - 添加路由
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Lobby } from './components/Lobby/Lobby';
import { Room } from './components/Room/Room';
import { Game } from './components/Game/Game';
import { socketService } from './services/socket.js';
import { useEffect } from 'react';
import { useRoomStore } from './store/useRoomStore.js';

function App() {
  // 在应用启动时连接 Socket
  useEffect(() => {
    socketService.connect();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<RoomWithGame />} />
      </Routes>
    </Router>
  );
}

// Room 页面包装器 - 在游戏开始时显示 Game 组件
function RoomWithGame() {
  const gameStarted = useRoomStore((state) => state.gameStarted);

  return (
    <>
      <Room />
      {gameStarted && <Game />}
    </>
  );
}

export default App;