/**
 * 房间控制器
 */

import { Room } from '../models/Room.js';
import { validateNickname, validateRoomId } from '../../../shared/validators.js';

// 存储所有房间（内存存储，后续可改为数据库）
const rooms = new Map();

/**
 * 创建房间
 * @param {string} nickname - 房主昵称
 * @returns {Object} 包含房间和房主信息
 */
export function createRoom(nickname) {
  // 验证昵称
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 创建房间
  const room = new Room(nickname);
  const host = room.players[0];

  // 存储房间
  rooms.set(room.id, room);

  console.log(`[RoomController] Room created: ${room.id} by ${nickname}`);

  return {
    roomId: room.id,
    playerId: host.id,
    player: host.toJSON(),
    room: room.toJSON(),
  };
}

/**
 * 加入房间
 * @param {string} roomId - 房间ID
 * @param {string} nickname - 玩家昵称
 * @returns {Object} 包含房间和玩家信息
 */
export function joinRoom(roomId, nickname) {
  // 验证房间ID
  const roomIdValidation = validateRoomId(roomId);
  if (!roomIdValidation.valid) {
    throw new Error(roomIdValidation.error);
  }

  // 验证昵称
  const nicknameValidation = validateNickname(nickname);
  if (!nicknameValidation.valid) {
    throw new Error(nicknameValidation.error);
  }

  // 查找房间
  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    throw new Error('房间不存在');
  }

  // 检查房间状态
  if (room.status !== 'waiting') {
    throw new Error('游戏已开始，无法加入');
  }

  // 添加玩家
  const player = room.addPlayer(nickname);
  if (!player) {
    throw new Error('房间已满或昵称已被占用');
  }

  console.log(`[RoomController] Player ${nickname} joined room ${roomId}`);

  return {
    roomId: room.id,
    playerId: player.id,
    player: player.toJSON(),
    room: room.toJSON(),
  };
}

/**
 * 离开房间
 * @param {string} roomId - 房间ID
 * @param {string} playerId - 玩家ID
 * @returns {Object} 离开结果
 */
export function leaveRoom(roomId, playerId) {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    throw new Error('房间不存在');
  }

  const player = room.getPlayer(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  room.removePlayer(playerId);

  console.log(`[RoomController] Player ${player.nickname} left room ${roomId}`);

  // 如果房间为空，删除房间
  if (room.isEmpty()) {
    rooms.delete(room.id);
    console.log(`[RoomController] Room ${roomId} deleted (empty)`);
    return {
      roomId: room.id,
      roomDeleted: true,
    };
  }

  return {
    roomId: room.id,
    room: room.toJSON(),
    newHostId: room.hostId,
  };
}

/**
 * 获取房间状态
 * @param {string} roomId - 房间ID
 * @returns {Object} 房间状态
 */
export function getRoomStatus(roomId) {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) {
    throw new Error('房间不存在');
  }

  return {
    room: room.toJSON(),
  };
}

/**
 * 获取所有房间（用于调试）
 * @returns {Map} 房间映射
 */
export function getAllRooms() {
  return rooms;
}
