/**
 * 绘画管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { socketService } from '../../services/socket.js';
import { SOCKET_EVENTS, DRAW_ACTION_TYPES } from '@shared/constants.js';

export function useDrawing(playerId, roomId) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [drawActions, setDrawActions] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // 监听绘画更新事件
  useEffect(() => {
    const socket = socketService.getSocket();

    socket.on(SOCKET_EVENTS.DRAW_UPDATE, (data) => {
      console.log('[useDrawing] Received draw update:', data);
      // 这里会由 Game 组件处理，更新所有玩家的画作
    });

    return () => {
      socket.off(SOCKET_EVENTS.DRAW_UPDATE);
    };
  }, []);

  /**
   * 处理点点击事件
   */
  const handlePointClick = useCallback(
    (point) => {
      if (!selectedPoint) {
        // 第一次点击：选中第一个点
        setSelectedPoint(point);
        console.log('[useDrawing] First point selected:', point.id);
      } else if (selectedPoint.id === point.id) {
        // 点击同一个点：取消选择
        setSelectedPoint(null);
        console.log('[useDrawing] Point selection canceled');
      } else {
        // 第二次点击不同的点：连接两点
        connectPoints(selectedPoint, point);
        setSelectedPoint(null);
      }
    },
    [selectedPoint, playerId]
  );

  /**
   * 连接两个点
   */
  const connectPoints = useCallback(
    (point1, point2) => {
      const action = {
        type: DRAW_ACTION_TYPES.CONNECT,
        point1: { id: point1.id, x: point1.x, y: point1.y },
        point2: { id: point2.id, x: point2.x, y: point2.y },
        playerId: playerId,
      };

      // 发送绘画动作到服务器
      sendDrawAction(action);

      // 添加到本地历史
      setDrawActions((prev) => [...prev, action]);

      console.log('[useDrawing] Points connected:', point1.id, '->', point2.id);
    },
    [playerId]
  );

  /**
   * 点亮点
   */
  const lightUpPoint = useCallback(
    (point) => {
      const action = {
        type: DRAW_ACTION_TYPES.LIGHT_UP,
        point: { id: point.id, x: point.x, y: point.y },
        playerId: playerId,
      };

      // 发送绘画动作到服务器
      sendDrawAction(action);

      // 更新点状态
      setDrawActions((prev) => [...prev, action]);

      console.log('[useDrawing] Point lit up:', point.id);
    },
    [playerId]
  );

  /**
   * 发送绘画动作到服务器
   */
  const sendDrawAction = useCallback(
    (action) => {
      const socket = socketService.getSocket();

      socket.emit(SOCKET_EVENTS.DRAW_ACTION, {
        roomId: roomId,
        action: action,
      });

      console.log('[useDrawing] Draw action sent:', action);
    },
    [roomId]
  );

  /**
   * 撤销操作
   */
  const undoAction = useCallback(() => {
    if (drawActions.length === 0) {
      console.log('[useDrawing] No actions to undo');
      return;
    }

    const lastAction = drawActions[drawActions.length - 1];

    // TODO: 发送撤销事件到服务器
    // socket.emit(SOCKET_EVENTS.UNDO_DRAW, { roomId, playerId, actionId: lastAction.id });

    // 移除最后一个动作
    setDrawActions((prev) => prev.slice(0, -1));

    console.log('[useDrawing] Action undone:', lastAction);
  }, [drawActions, playerId, roomId]);

  /**
   * 清空所有绘��
   */
  const clearDrawings = useCallback(() => {
    setDrawActions([]);
    setSelectedPoint(null);

    // TODO: 发送清空事件到服务器
    // socket.emit(SOCKET_EVENTS.CLEAR_DRAWINGS, { roomId, playerId });

    console.log('[useDrawing] All drawings cleared');
  }, [playerId, roomId]);

  /**
   * 重置绘画状态
   */
  const reset = useCallback(() => {
    setSelectedPoint(null);
    setDrawActions([]);
    setIsDrawing(false);
  }, []);

  return {
    selectedPoint,
    drawActions,
    isDrawing,
    handlePointClick,
    lightUpPoint,
    undoAction,
    clearDrawings,
    reset,
    setSelectedPoint,
  };
}