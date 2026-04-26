/**
 * 类型定义 - 前后端共享 (JSDoc)
 */

/**
 * 点对象
 * @typedef {Object} Point
 * @property {string} id - 点的唯一ID
 * @property {number} x - X坐标 (px)
 * @property {number} y - Y坐标 (px)
 * @property {boolean} isLit - 是否被点亮
 */

/**
 * 线段对象
 * @typedef {Object} Line
 * @property {string} id - 线段唯一ID
 * @property {Point} startPoint - 起始点
 * @property {Point} endPoint - 结束点
 * @property {string} playerId - 绘制该线段的玩家ID
 */

/**
 * 绘画动作
 * @typedef {Object} DrawAction
 * @property {string} type - 动作类型 ('connect' 或 'light_up')
 * @property {Point} [point1] - 第一个点（连线时使用）
 * @property {Point} [point2] - 第二个点（连线时使用）
 * @property {Point} [point] - 要点亮的点（点亮时使用）
 * @property {string} playerId - 执行动作的玩家ID
 */

/**
 * 玩家对象
 * @typedef {Object} Player
 * @property {string} id - 玩家唯一ID
 * @property {string} nickname - 昵称
 * @property {number} score - 当前分数 (初始10分)
 * @property {string} [secretWord] - 秘密词汇（游戏开始后分配）
 * @property {boolean} isHost - 是否为房主
 * @property {boolean} isOnline - 是否在线
 * @property {boolean} isEliminated - 是否已淘汰
 * @property {DrawAction[]} drawActions - 该玩家的所有绘画动作
 */

/**
 * 房间对象
 * @typedef {Object} Room
 * @property {string} id - 房间唯一ID (6位字符)
 * @property {Player[]} players - 房间内的玩家列表
 * @property {string} hostId - 房主ID
 * @property {string} status - 房间状态 ('waiting' | 'playing')
 * @property {string} [currentPhase] - 当前游戏阶段
 * @property {number} [currentRound] - 当前轮次
 */

/**
 * 游戏对象
 * @typedef {Object} Game
 * @property {string} roomId - 所属房间ID
 * @property {number} round - 当前轮次
 * @property {string} phase - 当前阶段 ('drawing' | 'guessing' | 'round_end')
 * @property {string[]} wordPool - 候选词池
 * @property {Object.<string, string>} playerWords - 每个玩家的秘密词汇
 * @property {Point[]} canvasPoints - 画布上的点
 * @property {Object.<string, DrawAction[]>} playerDrawings - 每个玩家的画作
 * @property {number} timeLeft - 剩余时间（秒）
 * @property {string[]} removedWords - 已���移除的词汇
 */

/**
 * Socket事件数据 - 创建房间
 * @typedef {Object} CreateRoomData
 * @property {string} nickname - 玩家昵称
 */

/**
 * Socket事件数据 - 加入房间
 * @typedef {Object} JoinRoomData
 * @property {string} roomId - 房间ID
 * @property {string} nickname - 玩家昵称
 */

/**
 * Socket事件响应 - 房间信息
 * @typedef {Object} RoomResponse
 * @property {string} roomId - 房间ID
 * @property {string} playerId - 玩家ID
 * @property {Player[]} players - 房间内所有玩家
 * @property {string} hostId - 房主ID
 */

/**
 * Socket事件响应 - 游戏开始
 * @typedef {Object} GameStartedResponse
 * @property {string} secretWord - 该玩家的秘密词汇
 * @property {string[]} wordPool - 候选词池
 * @property {Point[]} points - 画布上的点
 * @property {number} round - 当前轮次
 */

/**
 * Socket事件数据 - 提交猜词
 * @typedef {Object} SubmitGuessData
 * @property {string} playerId - 玩家ID
 * @property {string} wordId - 猜测的词汇ID
 */

/**
 * Socket事件响应 - 回合结算
 * @typedef {Object} RoundSummaryResponse
 * @property {Object.<string, string>} playerWords - 所有玩家的秘密词汇
 * @property {Object.<string, number>} scoreChanges - 分数变化
 * @property {Player[]} players - 更新后的玩家列表（分数、淘汰状态）
 * @property {boolean} gameEnded - 游戏是否结束
 */

/**
 * Socket事件响应 - 游戏结束
 * @typedef {Object} GameOverResponse
 * @property {Player} winner - 获胜者
 * @property {Player[]} leaderboard - 最终积分榜
 */

export const Types = {};