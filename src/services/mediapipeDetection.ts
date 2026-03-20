import { Pose as MediaPipePose } from '@mediapipe/pose'
import type { Results } from '@mediapipe/pose'
import type { Pose, PoseDetectorState, Keypoint } from '../types/pose'

// MediaPipe Pose 关键点连接定义 (33 个关键点)
export const KEYPOINT_CONNECTIONS: [number, number][] = [
  // 面部
  [0, 1], [1, 2], [2, 3], [3, 7],      // 左眼
  [0, 4], [4, 5], [5, 6], [6, 8],      // 右眼
  [9, 10],                             // 嘴巴
  // 躯干
  [11, 12],                            // 肩膀连接
  [11, 23], [12, 24],                  // 肩膀到臀部
  [23, 24],                            // 臀部连接
  // 左臂
  [11, 13], [13, 15],                  // 肩膀到肘部到手腕
  [15, 17], [15, 19], [15, 21],        // 左手
  [17, 19],                            // 手掌连接
  // 右臂
  [12, 14], [14, 16],                  // 肩膀到肘部到手腕
  [16, 18], [16, 20], [16, 22],        // 右手
  [18, 20],                            // 手掌连接
  // 左腿
  [23, 25], [25, 27],                  // 臀部到膝盖到脚踝
  [27, 29], [27, 31],                  // 左脚
  // 右腿
  [24, 26], [26, 28],                  // 臀部到膝盖到脚踝
  [28, 30], [28, 32]                   // 右脚
]

// 关键点名称 (MediaPipe 格式 - 33 个关键点)
export const KEYPOINT_NAMES = [
  'nose',                               // 0
  'left_eye_inner', 'left_eye', 'left_eye_outer',  // 1-3
  'right_eye_inner', 'right_eye', 'right_eye_outer', // 4-6
  'left_ear', 'right_ear',              // 7-8
  'mouth_left', 'mouth_right',          // 9-10
  'left_shoulder', 'right_shoulder',    // 11-12
  'left_elbow', 'right_elbow',          // 13-14
  'left_wrist', 'right_wrist',          // 15-16
  'left_pinky', 'right_pinky',          // 17-18
  'left_index', 'right_index',          // 19-20
  'left_thumb', 'right_thumb',          // 21-22
  'left_hip', 'right_hip',              // 23-24
  'left_knee', 'right_knee',            // 25-26
  'left_ankle', 'right_ankle',          // 27-28
  'left_heel', 'right_heel',            // 29-30
  'left_foot_index', 'right_foot_index' // 31-32
]

// 状态
const state: PoseDetectorState = {
  isModelLoading: false,
  isModelReady: false,
  modelError: null,
  loadingProgress: 0
}

// MediaPipe Pose 实例
let poseInstance: MediaPipePose | null = null

// 最新检测结果缓存
let latestResults: Pose[] = []

// 加载状态监听器
type StateListener = (state: PoseDetectorState) => void
const listeners: Set<StateListener> = new Set()

// 更新状态并通知监听器
function updateState(partial: Partial<PoseDetectorState>) {
  Object.assign(state, partial)
  listeners.forEach(listener => listener({ ...state }))
}

// 添加状态监听器
export function addStateListener(listener: StateListener): () => void {
  listeners.add(listener)
  listener({ ...state }) // 立即通知当前状态
  return () => listeners.delete(listener)
}

// 获取当前状态
export function getState(): PoseDetectorState {
  return { ...state }
}

// 检查模型是否就绪
export function isReady(): boolean {
  return state.isModelReady && poseInstance !== null
}

// 将 MediaPipe 结果转换为兼容的 Pose 格式
function convertResultsToPoses(results: Results): Pose[] {
  if (!results.poseLandmarks) {
    return []
  }

  // MediaPipe 只返回一个人的姿势
  const landmarks = results.poseLandmarks

  // 转换关键点格式
  const keypoints: Keypoint[] = landmarks.map((landmark, index) => ({
    x: landmark.x,
    y: landmark.y,
    score: landmark.visibility,
    name: KEYPOINT_NAMES[index]
  }))

  // 转换世界坐标 (3D)
  const keypoints3D = results.poseWorldLandmarks?.map((landmark, index) => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    score: landmark.visibility,
    name: KEYPOINT_NAMES[index]
  })) || []

  // 计算整体置信度分数
  const overallScore = keypoints.reduce((sum, kp) => sum + (kp.score || 0), 0) / keypoints.length

  return [{
    keypoints,
    keypoints3D,
    score: overallScore
  }]
}

// 处理 MediaPipe 检测结果
function onResults(results: Results): void {
  latestResults = convertResultsToPoses(results)
}

// 加载 MediaPipe Pose 模型
export async function loadModel(): Promise<void> {
  // 如果已经加载或正在加载,直接返回
  if (state.isModelReady || state.isModelLoading) {
    return
  }

  updateState({
    isModelLoading: true,
    modelError: null,
    loadingProgress: 0
  })

  try {
    // 第一步: 创建 MediaPipe Pose 实例 (20%)
    updateState({ loadingProgress: 10 })

    poseInstance = new MediaPipePose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      }
    })

    updateState({ loadingProgress: 20 })

    // 第二步: 配置模型参数 (40%)
    await poseInstance.setOptions({
      modelComplexity: 1,      // 0, 1, 或 2 (越高越精确但越慢)
      smoothLandmarks: true,   // 平滑化关键点
      enableSegmentation: false, // 不需要分割
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    updateState({ loadingProgress: 40 })

    // 第三步: 设置回调 (60%)
    poseInstance.onResults(onResults)

    updateState({ loadingProgress: 60 })

    // 第四步: 预热模型 (90%)
    // 创建一个简单的测试帧来初始化模型
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 等待模型初始化
    await poseInstance.initialize()

    updateState({ loadingProgress: 90 })

    // 第五步: 模型已就绪 (100%)
    updateState({
      isModelLoading: false,
      isModelReady: true,
      loadingProgress: 100
    })

    console.log('MediaPipe Pose 模型加载完成')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '模型加载失败'
    console.error('模型加载失败:', error)

    updateState({
      isModelLoading: false,
      isModelReady: false,
      modelError: errorMessage,
      loadingProgress: 0
    })

    throw error
  }
}

// 检测姿势
export async function detectPoses(video: HTMLVideoElement): Promise<Pose[]> {
  if (!poseInstance || !state.isModelReady) {
    return []
  }

  try {
    // MediaPipe 使用异步处理，需要发送帧并等待结果
    await poseInstance.send({ image: video })
    return latestResults
  } catch (error) {
    console.error('姿势检测失败:', error)
    return []
  }
}

// 释放模型资源
export async function disposeDetector(): Promise<void> {
  if (poseInstance) {
    poseInstance.close()
    poseInstance = null
  }

  latestResults = []

  updateState({
    isModelReady: false,
    isModelLoading: false,
    loadingProgress: 0
  })
}
