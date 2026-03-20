/**
 * FPS 监控服务
 * 用于实时监控和显示帧率
 */

export interface FPSMonitorState {
  fps: number
  averageFps: number
  frameTime: number
  isMonitoring: boolean
}

type StateListener = (state: FPSMonitorState) => void

// 状态
let state: FPSMonitorState = {
  fps: 0,
  averageFps: 0,
  frameTime: 0,
  isMonitoring: false
}

// 监听器列表
const listeners: Set<StateListener> = new Set()

// 帧率计算相关变量
let frameCount = 0
let lastTime = 0
let totalTime = 0
const fpsHistory: number[] = []
const HISTORY_SIZE = 60 // 保存最近60帧的历史

// 通知所有监听器
function notifyListeners(): void {
  listeners.forEach(listener => listener({ ...state }))
}

/**
 * 添加状态监听器
 */
export function addFPSListener(listener: StateListener): () => void {
  listeners.add(listener)
  // 立即通知当前状态
  listener({ ...state })
  return () => listeners.delete(listener)
}

/**
 * 开始监控
 */
export function startFPSMonitor(): void {
  if (state.isMonitoring) return

  state.isMonitoring = true
  frameCount = 0
  lastTime = performance.now()
  totalTime = 0
  fpsHistory.length = 0

  notifyListeners()
}

/**
 * 停止监控
 */
export function stopFPSMonitor(): void {
  state.isMonitoring = false
  state.fps = 0
  state.averageFps = 0
  state.frameTime = 0

  notifyListeners()
}

/**
 * 记录一帧
 * 在每一帧渲染后调用此函数
 */
export function recordFrame(): void {
  if (!state.isMonitoring) return

  const currentTime = performance.now()
  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  frameCount++
  totalTime += deltaTime

  // 计算当前帧率 (每秒帧数)
  // 使用最近几帧的平均值来平滑显示
  if (deltaTime > 0) {
    const instantFps = 1000 / deltaTime
    fpsHistory.push(instantFps)

    // 保持历史记录大小
    if (fpsHistory.length > HISTORY_SIZE) {
      fpsHistory.shift()
    }

    // 计算平均帧率
    const sum = fpsHistory.reduce((a, b) => a + b, 0)
    state.averageFps = Math.round(sum / fpsHistory.length)
    state.fps = Math.round(instantFps)
    state.frameTime = Math.round(deltaTime * 100) / 100 // 保留两位小数
  }

  // 每10帧通知一次更新,减少不必要的渲染
  if (frameCount % 10 === 0) {
    notifyListeners()
  }
}

/**
 * 获取当前状态
 */
export function getFPSState(): FPSMonitorState {
  return { ...state }
}
