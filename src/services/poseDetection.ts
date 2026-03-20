import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as poseDetection from '@tensorflow-models/pose-detection'
import type { Pose, PoseDetectorState } from '../types/pose'

// 移动端关键点连接定义 (COCO 格式 - 17 个关键点)
export const KEYPOINT_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], // 头部
  [1, 3], [2, 4], // 眼睛到耳朵
  [0, 5], [0, 6], // 鼻子到肩膀
  [5, 6],          // 肩膀连接
  [5, 7], [7, 9],  // 左臂
  [6, 8], [8, 10], // 右臂
  [5, 11], [6, 12], // 肩膀到臀部
  [11, 12],        // 臀部连接
  [11, 13], [13, 15], // 左腿
  [12, 14], [14, 16]  // 右腿
]

// 关键点名称 (COCO 格式)
export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

// 状态
const state: PoseDetectorState = {
  isModelLoading: false,
  isModelReady: false,
  modelError: null,
  loadingProgress: 0
}

// 检测器实例
let detector: poseDetection.PoseDetector | null = null

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
  return state.isModelReady && detector !== null
}

// 加载 MoveNet 模型
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
    // 第一步: 初始化 TensorFlow.js 后端 (30%)
    updateState({ loadingProgress: 10 })
    await tf.ready()
    updateState({ loadingProgress: 30 })

    // 确保使用 WebGL 后端
    const backend = tf.getBackend()
    if (backend !== 'webgl') {
      await tf.setBackend('webgl')
      await tf.ready()
    }

    // 第二步: 创建 MoveNet 检测器 (60%)
    updateState({ loadingProgress: 40 })

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true
      }
    )

    updateState({ loadingProgress: 90 })

    // 第三步: 模型已就绪 (100%)
    // 注意: 模型会在第一次实际使用时自动预热
    // 不需要手动预热，避免 Tensor 维度错误

    updateState({
      isModelLoading: false,
      isModelReady: true,
      loadingProgress: 100
    })

    console.log('MoveNet Lightning 模型加载完成')
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
  if (!detector || !state.isModelReady) {
    return []
  }

  try {
    const poses = await detector.estimatePoses(video, {
      flipHorizontal: true // 镜像翻转以匹配视频显示
    })
    return poses
  } catch (error) {
    console.error('姿势检测失败:', error)
    return []
  }
}

// 释放模型资源
export async function disposeDetector(): Promise<void> {
  if (detector) {
    detector.dispose()
    detector = null
  }

  updateState({
    isModelReady: false,
    isModelLoading: false,
    loadingProgress: 0
  })
}
