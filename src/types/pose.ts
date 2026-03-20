import type { Pose } from '@tensorflow-models/pose-detection'

export type { Pose }

export interface PoseDetectorState {
  isModelLoading: boolean
  isModelReady: boolean
  modelError: string | null
  loadingProgress: number // 0-100
}

export interface Keypoint {
  x: number
  y: number
  score?: number
  name?: string
}
