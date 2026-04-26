/**
 * 大厅页面组件
 */

import { CreateRoomForm } from './CreateRoomForm';
import { JoinRoomForm } from './JoinRoomForm';

export function Lobby() {
  return (
    <div className="lobby" style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '40px' }}>🎨 绘画猜词游戏</h1>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <CreateRoomForm />
        <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <JoinRoomForm />
        </div>
      </div>
    </div>
  );
}
