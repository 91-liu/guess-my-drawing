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

  // 游戏状态
  gameStarted: false,
  secretWord: null,
  wordPool: [],
  canvasPoints: [],
  round: 1,
  timeLeft: 120,
  phase: 'waiting',
  playerDrawings: {}, // { playerId: [drawActions] }

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
        // 如果是离线事件（断线），只更新在线状态
        if (data.isOffline) {
          const updatedPlayers = room.players.map((p) =>
            p.id === data.playerId ? { ...p, isOnline: false } : p
          );

          set({
            room: {
              ...room,
              players: updatedPlayers,
            },
          });

          console.log(`[RoomStore] Player went offline: ${data.playerName || data.playerId}`);
        } else {
          // 如果是主动离开，从列表中移除
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
              hostId: data.newHostId || room.hostId,
            },
          });

          console.log(`[RoomStore] Player left: ${data.playerId}`);
        }
      }
    });

    // 监听游戏开始事件
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      console.log('[RoomStore] Game started:', data);

      set({
        gameStarted: true,
        secretWord: data.secretWord,
        wordPool: data.wordPool,
        canvasPoints: data.canvasPoints,
        round: data.round,
      });

      console.log(`[RoomStore] Secret word: ${data.secretWord}`);
      console.log(`[RoomStore] Word pool: ${data.wordPool.length} words`);
      console.log(`[RoomStore] Canvas points: ${data.canvasPoints.length} points`);
    });

    // 监听时间更新事件
    socket.on(SOCKET_EVENTS.TIME_UPDATE, (data) => {
      set({
        timeLeft: data.timeLeft,
        phase: data.phase,
      });
    });

    // 监听时间警告事件
    socket.on(SOCKET_EVENTS.TIME_WARNING, (data) => {
      console.log(`[RoomStore] Time warning: ${data.timeLeft}s left`);
    });

    // 监听阶段切换事件
    socket.on(SOCKET_EVENTS.PHASE_CHANGE, (data) => {
      console.log(`[RoomStore] Phase changed: ${data.fromPhase} -> ${data.toPhase}`);

      set({
        phase: data.toPhase,
        round: data.round,
      });

      if (data.toPhase === 'guessing') {
        console.log('[RoomStore] Entered guessing phase');
      }
    });

    // 监听绘画更新事件
    socket.on(SOCKET_EVENTS.DRAW_UPDATE, (data) => {
      const { playerDrawings } = get();

      const { action, playerId } = data;

      // 更新该玩家的画作
      const existingActions = playerDrawings[playerId] || [];
      const updatedActions = [...existingActions, action];

      set({
        playerDrawings: {
          ...playerDrawings,
          [playerId]: updatedActions,
        },
      });

      console.log(`[RoomStore] Draw action received from player ${playerId}`);
    });
  },
}));
