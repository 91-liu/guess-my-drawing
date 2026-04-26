/**
 * 应用根组件 - 添加路由
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Lobby } from './components/Lobby/Lobby';
import { Room } from './components/Room/Room';
import { socketService } from './services/socket.js';
import { useEffect } from 'react';

function App() {
  // 在应用启动时连接 Socket
  useEffect(() => {
    socketService.connect();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}

export default App;