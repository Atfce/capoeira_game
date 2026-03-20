<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  loadModel,
  addStateListener,
  detectPoses,
  isReady
} from '../services/mediapipeDetection'
import {
  drawSkeleton,
  clearCanvas,
  resizeCanvasToVideo
} from '../services/skeletonDrawing'
import {
  startFPSMonitor,
  stopFPSMonitor,
  recordFrame,
  addFPSListener
} from '../services/fpsMonitor'
import type { PoseDetectorState, Pose } from '../types/pose'
import type { FPSMonitorState } from '../services/fpsMonitor'

// 视频状态
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isCameraOn = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// 全屏状态
const isFullscreen = ref(false)

// 模型状态
const modelState = ref<PoseDetectorState>({
  isModelLoading: false,
  isModelReady: false,
  modelError: null,
  loadingProgress: 0
})

// 摄像头流
let mediaStream: MediaStream | null = null

// 状态监听器取消函数
let unsubscribeState: (() => void) | null = null

// 姿势检测循环
let animationFrameId: number | null = null
let isDetecting = false

// FPS 监控状态
const fpsState = ref<FPSMonitorState>({
  fps: 0,
  averageFps: 0,
  frameTime: 0,
  isMonitoring: false
})

// FPS 状态监听器取消函数
let unsubscribeFPS: (() => void) | null = null

// FPS 状态样式计算
const fpsStatusClass = computed(() => {
  const fps = fpsState.value.averageFps
  if (fps >= 55) return 'fps-excellent'
  if (fps >= 30) return 'fps-good'
  return 'fps-poor'
})

// 组件挂载时加载模型
onMounted(async () => {
  // 订阅模型状态变化
  unsubscribeState = addStateListener((state) => {
    modelState.value = { ...state }
  })

  // 订阅 FPS 状态变化
  unsubscribeFPS = addFPSListener((state) => {
    fpsState.value = { ...state }
  })

  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 自动加载模型
  try {
    await loadModel()
  } catch (error) {
    console.error('模型加载失败:', error)
  }
})

// 监听摄像头状态,开启/关闭姿势检测
watch(isCameraOn, (newValue) => {
  if (newValue && modelState.value.isModelReady) {
    startPoseDetection()
  } else {
    stopPoseDetection()
  }
})

// 监听模型就绪状态
watch(() => modelState.value.isModelReady, (isReady) => {
  if (isReady && isCameraOn.value) {
    startPoseDetection()
  }
})

// 开启摄像头
async function startCamera() {
  // 重置状态
  errorMessage.value = ''
  isLoading.value = true

  try {
    // 请求摄像头权限
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    })

    // 设置视频源
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
      isCameraOn.value = true
    }
  } catch (error) {
    // 错误处理
    handleCameraError(error)
  } finally {
    isLoading.value = false
  }
}

// 关闭摄像头
function stopCamera() {
  // 停止姿势检测
  stopPoseDetection()

  if (mediaStream) {
    // 停止所有轨道
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  // 清空 Canvas
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      clearCanvas(ctx)
    }
  }

  isCameraOn.value = false
  errorMessage.value = ''
}

// 开始姿势检测循环
function startPoseDetection() {
  if (isDetecting) return

  isDetecting = true
  startFPSMonitor()
  detectLoop()
}

// 停止姿势检测循环
function stopPoseDetection() {
  isDetecting = false
  stopFPSMonitor()
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// 姿势检测循环
async function detectLoop() {
  if (!isDetecting || !videoRef.value || !canvasRef.value || !isReady()) {
    return
  }

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return
  }

  // 确保 Canvas 大小与视频匹配
  resizeCanvasToVideo(canvas, video)

  try {
    // 检测姿势
    const poses: Pose[] = await detectPoses(video)

    // 清空 Canvas
    clearCanvas(ctx)

    // 绘制每个检测到的姿势
    for (const pose of poses) {
      drawSkeleton(ctx, pose, canvas.width, canvas.height)
    }
  } catch (error) {
    console.error('姿势检测错误:', error)
  }

  // 记录帧率
  recordFrame()

  // 继续下一帧
  animationFrameId = requestAnimationFrame(detectLoop)
}

// 错误处理
function handleCameraError(error: unknown) {
  console.error('Camera error:', error)

  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        errorMessage.value = '摄像头权限被拒绝。请在浏览器设置中允许访问摄像头。'
        break
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        errorMessage.value = '未找到摄像头设备。请确保您的电脑已连接摄像头。'
        break
      case 'NotReadableError':
      case 'TrackStartError':
        errorMessage.value = '摄像头可能正在被其他应用程序使用。请关闭其他使用摄像头的程序后重试。'
        break
      case 'OverconstrainedError':
        errorMessage.value = '摄像头不支持所需的分辨率。'
        break
      case 'NotSupportedError':
        errorMessage.value = '您的浏览器不支持摄像头访问功能。请使用最新版本的 Chrome、Firefox 或 Edge。'
        break
      default:
        errorMessage.value = `访问摄像头时发生错误: ${error.message}`
    }
  } else {
    errorMessage.value = '访问摄像头时发生未知错误。'
  }
}

// 重试加载模型
async function retryLoadModel() {
  try {
    await loadModel()
  } catch (error) {
    console.error('模型加载失败:', error)
  }
}

// 获取加载进度文本
function getLoadingText(): string {
  const progress = modelState.value.loadingProgress
  if (progress < 20) {
    return '创建 MediaPipe Pose 实例...'
  } else if (progress < 40) {
    return '配置模型参数...'
  } else if (progress < 60) {
    return '设置回调函数...'
  } else if (progress < 90) {
    return '初始化模型...'
  } else {
    return '模型加载完成...'
  }
}

// 全屏状态变化处理
function handleFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement)
}

// 窗口大小变化处理
function handleResize() {
  // 确保 Canvas 在窗口大小变化后重新调整
  if (videoRef.value && canvasRef.value && isCameraOn.value) {
    resizeCanvasToVideo(canvasRef.value, videoRef.value)
  }
}

// 切换全屏模式
async function toggleFullscreen() {
  if (!containerRef.value) return

  try {
    if (!isFullscreen.value) {
      // 进入全屏
      if (containerRef.value.requestFullscreen) {
        await containerRef.value.requestFullscreen()
      } else {
        // Safari 兼容
        const element = containerRef.value as unknown as { webkitRequestFullscreen?: () => Promise<void> }
        if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen()
        }
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else {
        // Safari 兼容
        const doc = document as unknown as { webkitExitFullscreen?: () => Promise<void> }
        if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        }
      }
    }
  } catch (error) {
    console.error('全屏切换失败:', error)
  }
}

// 组件卸载时清理
onUnmounted(() => {
  stopCamera()

  // 移除事件监听器
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', handleResize)

  // 取消状态订阅
  if (unsubscribeState) {
    unsubscribeState()
    unsubscribeState = null
  }

  // 取消 FPS 状态订阅
  if (unsubscribeFPS) {
    unsubscribeFPS()
    unsubscribeFPS = null
  }

  // 注意: 不在这里释放模型,因为可能其他组件还在使用
  // 如果需要释放,应该在应用级别管理
})
</script>

<template>
  <div
    ref="containerRef"
    class="camera-container"
    :class="{ 'fullscreen-mode': isFullscreen }"
  >
    <!-- 模型加载状态指示器 -->
    <div v-if="modelState.isModelLoading && !isFullscreen" class="model-loading-banner">
      <div class="model-loading-content">
        <div class="loading-spinner small"></div>
        <div class="loading-info">
          <span class="loading-text">{{ getLoadingText() }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${modelState.loadingProgress}%` }"></div>
          </div>
          <span class="progress-text">{{ modelState.loadingProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- 模型加载错误提示 -->
    <div v-if="modelState.modelError && !modelState.isModelLoading && !isFullscreen" class="model-error-banner">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">模型加载失败: {{ modelState.modelError }}</span>
        <button class="btn-retry" @click="retryLoadModel">重试</button>
      </div>
    </div>

    <!-- 模型就绪提示 -->
    <div v-if="modelState.isModelReady && !isFullscreen" class="model-ready-banner">
      <span class="ready-icon">✓</span>
      <span>姿势识别模型已就绪</span>
    </div>

    <!-- 视频容器 -->
    <div class="video-wrapper">
      <video
        ref="videoRef"
        class="video-element"
        :class="{ 'video-active': isCameraOn }"
        autoplay
        playsinline
        muted
      ></video>

      <!-- Canvas 用于绘制骨架 -->
      <canvas
        ref="canvasRef"
        class="skeleton-canvas"
        :class="{ 'canvas-active': isCameraOn }"
      ></canvas>

      <!-- FPS 监控显示 - 右上角 -->
      <div v-if="fpsState.isMonitoring" class="fps-monitor" :class="fpsStatusClass">
        <div class="fps-value">{{ fpsState.averageFps }}</div>
        <div class="fps-label">FPS</div>
        <div class="fps-detail">{{ fpsState.frameTime.toFixed(1) }}ms</div>
      </div>

      <!-- 全屏按钮 - 左上角 -->
      <button
        v-if="isCameraOn"
        class="fullscreen-btn"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <span v-if="isFullscreen">⛶</span>
        <span v-else>⛶</span>
      </button>

      <!-- 占位符 - 摄像头未开启时显示 -->
      <div v-if="!isCameraOn && !errorMessage" class="placeholder">
        <div class="placeholder-icon">📷</div>
        <p>点击下方按钮开启摄像头</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-icon">⚠️</div>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>正在连接摄像头...</p>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls" :class="{ 'controls-fullscreen': isFullscreen }">
      <button
        v-if="!isCameraOn"
        class="btn btn-primary"
        :disabled="isLoading || modelState.isModelLoading"
        @click="startCamera"
      >
        {{ isLoading ? '连接中...' : '开启摄像头' }}
      </button>
      <button
        v-else
        class="btn btn-secondary"
        @click="stopCamera"
      >
        关闭摄像头
      </button>
    </div>
  </div>
</template>

<style scoped>
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  transition: all 0.3s ease;
}

/* 全屏模式 */
.camera-container.fullscreen-mode {
  max-width: 100%;
  width: 100%;
  height: 100vh;
  padding: 0;
  background: #0f0f1a;
}

.camera-container.fullscreen-mode .video-wrapper {
  border-radius: 0;
  height: 100%;
  aspect-ratio: auto;
}

.camera-container.fullscreen-mode .controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

/* 模型加载横幅 */
.model-loading-banner {
  width: 100%;
  max-width: 800px;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.15) 0%, rgba(0, 212, 170, 0.15) 100%);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 12px;
}

.model-loading-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loading-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-text {
  color: #a0d8ff;
  font-size: 14px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff 0%, #00d4aa 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #00d4aa;
  font-size: 12px;
  font-weight: 600;
}

/* 模型错误横幅 */
.model-error-banner {
  width: 100%;
  max-width: 800px;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 12px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-icon {
  font-size: 20px;
}

.error-text {
  flex: 1;
  color: #ff6b6b;
  font-size: 14px;
}

.btn-retry {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(220, 53, 69, 0.3);
  border: 1px solid rgba(220, 53, 69, 0.5);
  border-radius: 6px;
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: rgba(220, 53, 69, 0.5);
}

/* 模型就绪横幅 */
.model-ready-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 16px;
  background: rgba(0, 212, 170, 0.15);
  border: 1px solid rgba(0, 212, 170, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #00d4aa;
}

.ready-icon {
  font-weight: bold;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.video-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #1a1a2e;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-element.video-active {
  opacity: 1;
  transform: scaleX(-1); /* 镜像效果 */
}

/* Canvas 骨架层 */
.skeleton-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不阻挡视频交互 */
  opacity: 0;
  transition: opacity 0.3s ease;
}

.skeleton-canvas.canvas-active {
  opacity: 1;
  transform: scaleX(-1); /* 与视频同步镜像 */
}

.placeholder,
.error-message {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  text-align: center;
  padding: 20px;
}

.placeholder-icon,
.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.1);
  color: #ff6b6b;
}

.error-message p {
  max-width: 400px;
  line-height: 1.5;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(26, 26, 46, 0.9);
  color: #ffffff;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #333;
  border-top-color: #4a9eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 3px;
  margin-bottom: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.controls {
  margin-top: 24px;
}

.btn {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4a9eff 0%, #0066cc 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
}

/* FPS 监控显示 */
.fps-monitor {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  text-align: center;
  min-width: 60px;
  z-index: 10;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.fps-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.fps-label {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.8;
  margin-top: 2px;
}

.fps-detail {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

/* FPS 状态颜色 */
.fps-monitor.fps-excellent {
  color: #00d4aa;
  border: 1px solid rgba(0, 212, 170, 0.3);
}

.fps-monitor.fps-good {
  color: #ffc107;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.fps-monitor.fps-poor {
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

/* 全屏按钮 */
.fullscreen-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.fullscreen-btn:active {
  transform: scale(0.95);
}

/* 全屏控制按钮样式 */
.controls-fullscreen {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.controls-fullscreen .btn {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.controls-fullscreen .btn-primary {
  background: rgba(74, 158, 255, 0.8);
}

.controls-fullscreen .btn-secondary {
  background: rgba(108, 117, 125, 0.8);
}

/* 响应式布局 - 平板 */
@media (max-width: 1024px) {
  .camera-container {
    padding: 16px;
  }

  .fps-monitor {
    padding: 6px 10px;
    min-width: 50px;
  }

  .fps-value {
    font-size: 20px;
  }

  .fullscreen-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* 响应式布局 - 手机 */
@media (max-width: 768px) {
  .camera-container {
    padding: 12px;
  }

  .placeholder-icon,
  .error-icon {
    font-size: 48px;
  }

  .btn {
    padding: 10px 24px;
    font-size: 14px;
  }

  .model-loading-banner,
  .model-error-banner {
    padding: 12px 16px;
  }

  .model-loading-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .fps-monitor {
    top: 8px;
    right: 8px;
    padding: 6px 8px;
    min-width: 45px;
  }

  .fps-value {
    font-size: 18px;
  }

  .fps-label {
    font-size: 9px;
  }

  .fps-detail {
    font-size: 10px;
  }

  .fullscreen-btn {
    top: 8px;
    left: 8px;
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .controls {
    margin-top: 16px;
  }

  .controls-fullscreen {
    bottom: 16px;
  }
}

/* 响应式布局 - 小屏手机 */
@media (max-width: 480px) {
  .camera-container {
    padding: 8px;
  }

  .placeholder-icon,
  .error-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .placeholder p,
  .error-message p {
    font-size: 14px;
  }

  .btn {
    padding: 8px 20px;
    font-size: 13px;
  }

  .model-loading-banner,
  .model-error-banner {
    padding: 10px 12px;
    margin-bottom: 12px;
  }

  .model-ready-banner {
    padding: 6px 12px;
    font-size: 12px;
    margin-bottom: 12px;
  }

  .fps-monitor {
    padding: 4px 6px;
    min-width: 40px;
  }

  .fps-value {
    font-size: 16px;
  }

  .fullscreen-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
}

/* 横屏模式优化 (移动端) */
@media (max-height: 500px) and (orientation: landscape) {
  .camera-container {
    padding: 8px;
  }

  .model-loading-banner,
  .model-error-banner,
  .model-ready-banner {
    display: none;
  }

  .controls {
    margin-top: 8px;
  }

  .btn {
    padding: 6px 16px;
    font-size: 12px;
  }
}

/* 全屏模式下的移动端适配 */
@media (max-width: 768px) {
  .camera-container.fullscreen-mode .controls {
    bottom: 12px;
  }

  .camera-container.fullscreen-mode .btn {
    padding: 8px 20px;
    font-size: 13px;
  }
}
</style>
