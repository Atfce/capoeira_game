import type { Pose } from '../types/pose'
import { KEYPOINT_CONNECTIONS } from './poseDetection'

// 绘制配置
const CONFIG = {
  // 关键点样式
  keypoint: {
    radius: 6,
    color: '#ff4444', // 红色关键点
    borderColor: '#ffffff',
    borderWidth: 2,
    minScore: 0.3 // 最低置信度阈值
  },
  // 骨架连接线样式
  skeleton: {
    lineWidth: 3,
    color: '#00ffff', // 青色线条
    minScore: 0.3 // 最低置信度阈值
  }
}

// 绘制骨架到 Canvas
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!pose.keypoints || pose.keypoints.length === 0) {
    return
  }

  const keypoints = pose.keypoints

  // 绘制骨架连接线
  drawConnections(ctx, keypoints, canvasWidth, canvasHeight)

  // 绘制关键点
  drawKeypoints(ctx, keypoints, canvasWidth, canvasHeight)
}

// 绘制骨架连接线
function drawConnections(
  ctx: CanvasRenderingContext2D,
  keypoints: Pose['keypoints'],
  _canvasWidth: number,
  _canvasHeight: number
): void {
  ctx.strokeStyle = CONFIG.skeleton.color
  ctx.lineWidth = CONFIG.skeleton.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const [i, j] of KEYPOINT_CONNECTIONS) {
    const kp1 = keypoints[i]
    const kp2 = keypoints[j]

    // 检查两个关键点是否都有效
    if (
      kp1 &&
      kp2 &&
      isValidKeypoint(kp1) &&
      isValidKeypoint(kp2) &&
      (kp1.score ?? 0) >= CONFIG.skeleton.minScore &&
      (kp2.score ?? 0) >= CONFIG.skeleton.minScore
    ) {
      ctx.beginPath()
      ctx.moveTo(kp1.x, kp1.y)
      ctx.lineTo(kp2.x, kp2.y)
      ctx.stroke()
    }
  }
}

// 绘制关键点
function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  keypoints: Pose['keypoints'],
  _canvasWidth: number,
  _canvasHeight: number
): void {
  for (const keypoint of keypoints) {
    if (!isValidKeypoint(keypoint)) {
      continue
    }

    // 检查置信度
    if ((keypoint.score ?? 0) < CONFIG.keypoint.minScore) {
      continue
    }

    const { x, y } = keypoint

    // 绘制关键点边框
    ctx.beginPath()
    ctx.arc(x, y, CONFIG.keypoint.radius, 0, 2 * Math.PI)
    ctx.fillStyle = CONFIG.keypoint.color
    ctx.fill()

    // 绘制关键点边框
    ctx.strokeStyle = CONFIG.keypoint.borderColor
    ctx.lineWidth = CONFIG.keypoint.borderWidth
    ctx.stroke()
  }
}

// 检查关键点是否有效
function isValidKeypoint(keypoint: Pose['keypoints'][number]): boolean {
  return (
    keypoint !== null &&
    keypoint !== undefined &&
    typeof keypoint.x === 'number' &&
    typeof keypoint.y === 'number' &&
    !isNaN(keypoint.x) &&
    !isNaN(keypoint.y) &&
    isFinite(keypoint.x) &&
    isFinite(keypoint.y)
  )
}

// 清空 Canvas
export function clearCanvas(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

// 调整 Canvas 大小以匹配视频
export function resizeCanvasToVideo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): void {
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight

  if (videoWidth > 0 && videoHeight > 0) {
    canvas.width = videoWidth
    canvas.height = videoHeight
  }
}
