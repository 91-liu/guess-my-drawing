/**
 * 房间状态管理 (Zustand)
 */

import { create } from 'zustand';
import { socketService } from '../services/socket.js';
import { SOCKET_EVENTS } from '../../shared/constants.js';

export const useRoomStore = create((set, get) => ({
  // 状态
  roomId: null,
  playerId: null,
  player: null,
  room: null,
  loading: false,
  error: null,

  /**
   * 创建房间
   * @param {string} nickname - 玩家昵称
   */
  createRoom: async (nickname) => {
    set({ loading: true, error: null });

    const socket = socketService.getSocket();

    return new Promise((resolve, reject) => {
      socket.emit(SOCKET_EVENTS.CREATE_ROOM, { nickname }, (response) => {
        if (response.success) {
          const { roomId, playerId, player, room } = response.data;

          set({
            roomId,
            playerId,
            player,
            room,
            loading: false,
            error: null,
          });

          console.log(`[RoomStore] Room created: ${roomId}`);
          resolve(response.data);
        } else {
          set({ loading: false, error: response.error });
          reject(new Error(response.error));
        }
      });
    });
  },

  /**
   * 加入房间
   * @param {string} roomId - 房间ID
   * @param {string} nickname - 玩家昵称
   */
  joinRoom: async (roomId, nickname) => {
    set({ loading: true, error: null });

    const socket = socketService.getSocket();

    return new Promise((resolve, reject) => {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, nickname }, (response) => {
        if (response.success) {
          const { roomId, playerId, player, room } = response.data;

          set({
            roomId,
            playerId,
            player,
            room,
            loading: false,
            error: null,
          });

          console.log(`[RoomStore] Joined room: ${roomId}`);
          resolve(response.data);
        } else {
          set({ loading: false, error: response.error });
          reject(new Error(response.error));
        }
      });
    });
  },

  /**
   * 离开房间
   */
  leaveRoom: async () => {
    const { roomId, playerId } = get();

    if (!roomId || !playerId) return;

    const socket = socketService.getSocket();

    return new Promise((resolve) => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId, playerId }, (response) => {
        set({
          roomId: null,
          playerId: null,
          player: null,
          room: null,
          error: null,
        });

        console.log('[RoomStore] Left room');
        resolve();
      });
    });
  },

  /**
   * 更新房间状态
   * @param {Object} roomData - 房间数据
   */
  updateRoom: (roomData) => {
    set({ room: roomData });
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 监听房间事件
   */
  setupListeners: () => {
    const socket = socketService.getSocket();

    // 监听玩家加入事件
    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      const { room } = get();
      if (room) {
        set({
          room: {
            ...room,
            players: [...room.players, data.player],
          },
        });
        console.log(`[RoomStore] Player joined: ${data.player.nickname}`);
      }
    });

    // 监听玩家离开事件
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      const { room, playerId } = get();
      if (room) {
        const updatedPlayers = room.players.filter((p) => p.id !== data.playerId);

        // 如果房主变更，更新房主状态
        const updatedPlayersWithNewHost = updatedPlayers.map((p) => ({
          ...p,
          isHost: p.id === data.newHostId,
        }));

        set({
          room: {
            ...room,
            players: updatedPlayersWithNewHost,
            hostId: data.newHostId,
          },
        });

        console.log(`[RoomStore] Player left: ${data.playerId}`);
      }
    });
  },
}));
