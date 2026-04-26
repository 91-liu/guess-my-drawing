/**
 * 游戏常量定义 - 前后端共享
 */

// 画布配置
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const POINT_COUNT_MIN = 15;
export const POINT_COUNT_MAX = 20;
export const POINT_RADIUS = 5;
export const POINT_MIN_DISTANCE = 30;

// 游戏规则
export const PLAYER_INITIAL_SCORE = 10;
export const DRAWING_TIME_LIMIT = 120; // 秒
export const WORDS_PER_PLAYER = 2;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const ROOM_ID_LENGTH = 6;

// Socket 事件类型
export const SOCKET_EVENTS = {
  // 连接相关
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  RECONNECT_SUCCESS: 'reconnect_success',
  RECONNECT_FAILED: 'reconnect_failed',

  // 房间相关
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_STATUS: 'room_status',
  ROOM_ERROR: 'room_error',

  // 游戏流程
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  PHASE_CHANGE: 'phase_change',
  NEXT_ROUND: 'next_round',
  ROUND_STARTED: 'round_started',

  // 绘画相关
  DRAW_ACTION: 'draw_action',
  DRAW_UPDATE: 'draw_update',

  // 猜词相关
  SUBMIT_GUESS: 'submit_guess',
  WORD_REMOVED: 'word_removed',
  GUESS_ERROR: 'guess_error',

  // 计时器
  TIME_UPDATE: 'time_update',
  TIME_WARNING: 'time_warning',

  // 结算
  END_ROUND: 'end_round',
  ROUND_SUMMARY: 'round_summary',
  GAME_OVER: 'game_over',

  // 测试
  TEST_EVENT: 'test_event',
  TEST_RESPONSE: 'test_response'
};

// 游戏阶段
export const GAME_PHASES = {
  LOBBY: 'lobby',
  WAITING: 'waiting',
  DRAWING: 'drawing',
  GUESSING: 'guessing',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over'
};

// 绘画动作类型
export const DRAW_ACTION_TYPES = {
  CONNECT: 'connect', // 连接两点
  LIGHT_UP: 'light_up' // 点亮点
};

// 预定义词汇库（Phase 1 使用，Phase 3 替换为 AI 生成）
export const PREDEFINED_WORDS = [
  '太阳', '月亮', '星星', '房子', '汽车', '飞机',
  '小鸟', '大树', '花朵', '雪山', '河流', '海洋',
  '书桌', '椅子', '手机', '电脑', '蛋糕', '冰淇淋',
  '篮球', '足球', '钢琴', '吉他', '雨伞', '眼镜',
  '帽子', '鞋子', '苹果', '香蕉', '西瓜', '葡萄'
];

// 端口配置
export const SERVER_PORT = 3000;
export const CLIENT_PORT = 5173;
