import type { Pose, Keypoint } from '../types/pose'
import { KEYPOINT_CONNECTIONS } from './mediapipeDetection'

// 绘制配置
const CONFIG = {
  // 关键点样式
  keypoint: {
    radius: 6,
    color: '#ff4444', // 红色关键点（默认）
    borderColor: '#ffffff',
    borderWidth: 2,
    minScore: 0.3 // 最低置信度阈值
  },
  // 骨架连接线样式
  skeleton: {
    lineWidth: 3,
    color: '#00ffff', // 青色线条（默认）
    minScore: 0.3 // 最低置信度阈值
  }
}

// 不同身体部位的颜色配置
const BODY_PART_COLORS = {
  // 面部
  face: '#ff4444',           // 红色
  faceConnection: '#ff6666', // 浅红色
  // 躯干
  torso: '#ffaa00',          // 橙色
  torsoConnection: '#ffcc44', // 浅橙色
  // 左侧（手臂和腿）
  leftArm: '#44ff44',        // 绿色
  leftArmConnection: '#66ff66',
  leftLeg: '#44ff44',
  leftLegConnection: '#66ff66',
  // 右侧（手臂和腿）
  rightArm: '#4444ff',       // 蓝色
  rightArmConnection: '#6666ff',
  rightLeg: '#4444ff',
  rightLegConnection: '#6666ff',
  // 手部
  leftHand: '#44ff44',
  rightHand: '#4444ff',
  // 脚部
  leftFoot: '#44ff44',
  rightFoot: '#4444ff'
}

// 关键点索引分组（MediaPipe 33 个关键点）
const KEYPOINT_GROUPS = {
  // 面部关键点 (0-10)
  face: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  // 躯干关键点 (11-12, 23-24)
  torso: [11, 12, 23, 24],
  // 左臂关键点 (11, 13, 15)
  leftArm: [11, 13, 15],
  // 右臂关键点 (12, 14, 16)
  rightArm: [12, 14, 16],
  // 左手关键点 (15, 17, 19, 21)
  leftHand: [15, 17, 19, 21],
  // 右手关键点 (16, 18, 20, 22)
  rightHand: [16, 18, 20, 22],
  // 左腿关键点 (23, 25, 27)
  leftLeg: [23, 25, 27],
  // 右腿关键点 (24, 26, 28)
  rightLeg: [24, 26, 28],
  // 左脚关键点 (27, 29, 31)
  leftFoot: [27, 29, 31],
  // 右脚关键点 (28, 30, 32)
  rightFoot: [28, 30, 32]
}

// 连接线分组
const CONNECTION_GROUPS = {
  // 面部连接
  face: [
    [0, 1], [1, 2], [2, 3], [3, 7],      // 左眼
    [0, 4], [4, 5], [5, 6], [6, 8],      // 右眼
    [9, 10]                               // 嘴巴
  ] as [number, number][],
  // 躯干连接
  torso: [
    [11, 12],                             // 肩膀连接
    [23, 24],                             // 臀部连接
    [11, 23], [12, 24]                    // 肩膀到臀部
  ] as [number, number][],
  // 左臂连接
  leftArm: [
    [11, 13], [13, 15]
  ] as [number, number][],
  // 右臂连接
  rightArm: [
    [12, 14], [14, 16]
  ] as [number, number][],
  // 左手连接
  leftHand: [
    [15, 17], [15, 19], [15, 21], [17, 19]
  ] as [number, number][],
  // 右手连接
  rightHand: [
    [16, 18], [16, 20], [16, 22], [18, 20]
  ] as [number, number][],
  // 左腿连接
  leftLeg: [
    [23, 25], [25, 27]
  ] as [number, number][],
  // 右腿连接
  rightLeg: [
    [24, 26], [26, 28]
  ] as [number, number][],
  // 左脚连接
  leftFoot: [
    [27, 29], [27, 31]
  ] as [number, number][],
  // 右脚连接
  rightFoot: [
    [28, 30], [28, 32]
  ] as [number, number][]
}

// 获取关键点颜色
function getKeypointColor(index: number): string {
  if (KEYPOINT_GROUPS.face.includes(index)) return BODY_PART_COLORS.face
  if (KEYPOINT_GROUPS.torso.includes(index)) return BODY_PART_COLORS.torso
  if (KEYPOINT_GROUPS.leftHand.includes(index)) return BODY_PART_COLORS.leftHand
  if (KEYPOINT_GROUPS.rightHand.includes(index)) return BODY_PART_COLORS.rightHand
  if (KEYPOINT_GROUPS.leftArm.includes(index)) return BODY_PART_COLORS.leftArm
  if (KEYPOINT_GROUPS.rightArm.includes(index)) return BODY_PART_COLORS.rightArm
  if (KEYPOINT_GROUPS.leftFoot.includes(index)) return BODY_PART_COLORS.leftFoot
  if (KEYPOINT_GROUPS.rightFoot.includes(index)) return BODY_PART_COLORS.rightFoot
  if (KEYPOINT_GROUPS.leftLeg.includes(index)) return BODY_PART_COLORS.leftLeg
  if (KEYPOINT_GROUPS.rightLeg.includes(index)) return BODY_PART_COLORS.rightLeg
  return CONFIG.keypoint.color
}

// 获取连接线颜色
function getConnectionColor(connection: [number, number]): string {
  // 检查属于哪个组
  for (const conn of CONNECTION_GROUPS.face) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.faceConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.torso) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.torsoConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.leftArm) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.leftArmConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.rightArm) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.rightArmConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.leftHand) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.leftHand
    }
  }
  for (const conn of CONNECTION_GROUPS.rightHand) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.rightHand
    }
  }
  for (const conn of CONNECTION_GROUPS.leftLeg) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.leftLegConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.rightLeg) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.rightLegConnection
    }
  }
  for (const conn of CONNECTION_GROUPS.leftFoot) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.leftFoot
    }
  }
  for (const conn of CONNECTION_GROUPS.rightFoot) {
    if (conn[0] === connection[0] && conn[1] === connection[1]) {
      return BODY_PART_COLORS.rightFoot
    }
  }

  return CONFIG.skeleton.color
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
  keypoints: Keypoint[],
  _canvasWidth: number,
  _canvasHeight: number
): void {
  ctx.lineWidth = CONFIG.skeleton.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const connection of KEYPOINT_CONNECTIONS) {
    const [i, j] = connection
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
      ctx.strokeStyle = getConnectionColor(connection)
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
  keypoints: Keypoint[],
  _canvasWidth: number,
  _canvasHeight: number
): void {
  keypoints.forEach((keypoint, index) => {
    if (!isValidKeypoint(keypoint)) {
      return
    }

    // 检查置信度
    if ((keypoint.score ?? 0) < CONFIG.keypoint.minScore) {
      return
    }

    const { x, y } = keypoint

    // 绘制关键点边框
    ctx.beginPath()
    ctx.arc(x, y, CONFIG.keypoint.radius, 0, 2 * Math.PI)
    ctx.fillStyle = getKeypointColor(index)
    ctx.fill()

    // 绘制关键点边框
    ctx.strokeStyle = CONFIG.keypoint.borderColor
    ctx.lineWidth = CONFIG.keypoint.borderWidth
    ctx.stroke()
  })
}

// 检查关键点是否有效
function isValidKeypoint(keypoint: Keypoint): boolean {
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
