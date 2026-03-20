// MediaPipe Pose 类型定义

// 基础关键点类型（2D 坐标）
export interface Keypoint {
  x: number
  y: number
  z?: number           // MediaPipe 提供的深度信息
  score?: number       // 置信度/可见度
  name?: string        // 关键点名称
  visibility?: number  // MediaPipe 可见度 (0-1)
}

// 3D 世界坐标关键点
export interface Keypoint3D extends Keypoint {
  z: number  // 在世界坐标系中的深度（米）
}

// 姿势数据结构
export interface Pose {
  keypoints: Keypoint[]
  keypoints3D?: Keypoint[]    // 3D 世界坐标（可选）
  score?: number              // 整体姿势置信度
}

// 检测器状态
export interface PoseDetectorState {
  isModelLoading: boolean
  isModelReady: boolean
  modelError: string | null
  loadingProgress: number // 0-100
}

// MediaPipe Pose 配置选项
export interface MediaPipePoseConfig {
  modelComplexity: 0 | 1 | 2  // 模型复杂度 (0=轻量, 1=默认, 2=高精度)
  smoothLandmarks: boolean     // 是否平滑关键点
  enableSegmentation: boolean  // 是否启用分割
  smoothSegmentation: boolean  // 是否平滑分割
  minDetectionConfidence: number  // 最小检测置信度 (0-1)
  minTrackingConfidence: number   // 最小跟踪置信度 (0-1)
}

// 默认配置
export const DEFAULT_MEDIAPIPE_CONFIG: MediaPipePoseConfig = {
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
}
