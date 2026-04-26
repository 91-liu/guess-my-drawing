/**
 * 创建房间表单组件
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/useRoomStore';
import { validateNickname } from '../../../shared/validators.js';

export function CreateRoomForm() {
  const [nickname, setNickname] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { createRoom, loading, error } = useRoomStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 本地验证
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setLocalError(validation.error);
      return;
    }

    setLocalError('');

    try {
      const result = await createRoom(nickname);
      console.log('[CreateRoomForm] Room created:', result);

      // 跳转到房间页面
      navigate(`/room/${result.roomId}`);
    } catch (err) {
      console.error('[CreateRoomForm] Error:', err);
      setLocalError(err.message);
    }
  };

  const handleInputChange = (e) => {
    setNickname(e.target.value);
    setLocalError('');
  };

  const displayError = localError || error;

  return (
    <div className="create-room-form">
      <h2>创建房间</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">昵称：</label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={handleInputChange}
            placeholder="请输入您的昵称"
            disabled={loading}
            maxLength={20}
            autoFocus
          />
        </div>

        {displayError && (
          <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
            {displayError}
          </div>
        )}

        <button type="submit" disabled={loading || !nickname.trim()}>
          {loading ? '创建中...' : '创建房间'}
        </button>
      </form>
    </div>
  );
}
