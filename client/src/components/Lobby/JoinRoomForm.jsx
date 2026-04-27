/**
 * 加入房间表单组件
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/useRoomStore';
import { validateNickname, validateRoomId } from '@shared/validators.js';

export function JoinRoomForm() {
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { joinRoom, loading, error } = useRoomStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 本地验证房间ID
    const roomIdValidation = validateRoomId(roomId);
    if (!roomIdValidation.valid) {
      setLocalError(roomIdValidation.error);
      return;
    }

    // 本地验证昵称
    const nicknameValidation = validateNickname(nickname);
    if (!nicknameValidation.valid) {
      setLocalError(nicknameValidation.error);
      return;
    }

    setLocalError('');

    try {
      const result = await joinRoom(roomId, nickname);
      console.log('[JoinRoomForm] Joined room:', result);

      // 跳转到房间页面
      navigate(`/room/${result.roomId}`);
    } catch (err) {
      console.error('[JoinRoomForm] Error:', err);
      setLocalError(err.message);
    }
  };

  const handleRoomIdChange = (e) => {
    const value = e.target.value.toUpperCase();
    setRoomId(value);
    setLocalError('');
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setLocalError('');
  };

  const displayError = localError || error;

  return (
    <div className="join-room-form" style={{ marginTop: '30px' }}>
      <h2>加入房间</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="roomId">房间ID：</label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={handleRoomIdChange}
            placeholder="请输入6位房间ID"
            disabled={loading}
            maxLength={6}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label htmlFor="joinNickname">昵称：</label>
          <input
            type="text"
            id="joinNickname"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="请输入您的昵称"
            disabled={loading}
            maxLength={20}
          />
        </div>

        {displayError && (
          <div className="error-message" style={{ color: 'red', marginTop: '10px', marginBottom: '10px' }}>
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !roomId.trim() || !nickname.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? '加入中...' : '加入房间'}
        </button>
      </form>
    </div>
  );
}
