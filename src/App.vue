<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CameraView from './components/CameraView.vue'

// 全屏状态
const isFullscreen = ref(false)

// 监听全屏状态变化
function handleFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement)
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div class="app" :class="{ 'fullscreen-active': isFullscreen }">
    <header v-if="!isFullscreen" class="app-header">
      <h1>Pose Detection</h1>
      <p>姿势识别互动应用</p>
    </header>
    <main class="app-main">
      <CameraView />
    </main>
  </div>
</template>

<style>
/* 全局样式重置 */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  color: #ffffff;
  overflow-x: hidden;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app.fullscreen-active {
  overflow: hidden;
}

.app-header {
  text-align: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4a9eff 0%, #00d4aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-header p {
  margin-top: 8px;
  font-size: 1rem;
  color: #a0a0a0;
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* 响应式布局 - 平板 */
@media (max-width: 1024px) {
  .app-header {
    padding: 20px 16px;
  }

  .app-header h1 {
    font-size: 1.75rem;
  }
}

/* 响应式布局 - 手机 */
@media (max-width: 768px) {
  .app-header {
    padding: 16px 12px;
  }

  .app-header h1 {
    font-size: 1.5rem;
  }

  .app-header p {
    font-size: 0.875rem;
  }

  .app-main {
    align-items: stretch;
  }
}

/* 响应式布局 - 小屏手机 */
@media (max-width: 480px) {
  .app-header {
    padding: 12px 8px;
  }

  .app-header h1 {
    font-size: 1.25rem;
  }

  .app-header p {
    font-size: 0.75rem;
    margin-top: 4px;
  }
}

/* 横屏模式优化 (移动端) */
@media (max-height: 500px) and (orientation: landscape) {
  .app-header {
    padding: 8px 12px;
  }

  .app-header h1 {
    font-size: 1.25rem;
  }

  .app-header p {
    display: none;
  }
}
</style>
