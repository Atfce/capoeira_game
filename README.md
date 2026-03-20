# Pose Detection Web App

基于 Vue 3 + TypeScript + Vite 的实时人体姿势识别 Web 应用。

## 技术栈

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **语言**: TypeScript
- **构建工具**: Vite
- **姿势识别**: MediaPipe Pose

## 功能特性

- 实时摄像头姿势检测
- 33 个身体关键点识别
- 彩色骨架绘制（左侧绿色、右侧蓝色、面部红色、躯干橙色）
- FPS 实时监控
- 全屏模式支持
- 响应式设计

## 开始使用

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
src/
├── components/
│   └── CameraView.vue      # 摄像头视图组件
├── services/
│   ├── mediapipeDetection.ts  # MediaPipe Pose 服务
│   ├── skeletonDrawing.ts     # 骨架绘制服务
│   └── fpsMonitor.ts          # FPS 监控服务
├── types/
│   └── pose.ts             # 类型定义
├── App.vue                 # 根组件
└── main.ts                 # 入口文件
```

## MediaPipe Pose 配置

当前使用的 MediaPipe Pose 配置：

| 参数 | 值 | 说明 |
|------|-----|------|
| modelComplexity | 1 | 模型复杂度 (0=轻量, 1=默认, 2=高精度) |
| smoothLandmarks | true | 平滑化关键点 |
| enableSegmentation | false | 不启用分割 |
| minDetectionConfidence | 0.5 | 最小检测置信度 |
| minTrackingConfidence | 0.5 | 最小跟踪置信度 |

### 性能调优建议

1. **提高性能**：将 `modelComplexity` 设置为 0
2. **提高精度**：将 `modelComplexity` 设置为 2
3. **减少抖动**：确保 `smoothLandmarks` 为 true
4. **低光照环境**：降低 `minDetectionConfidence` 和 `minTrackingConfidence`

## 关键点说明

MediaPipe Pose 提供 33 个身体关键点：

- **面部** (0-10): 鼻子、眼睛、耳朵、嘴巴
- **躯干** (11-12, 23-24): 肩膀、臀部
- **手臂** (13-16): 肘部、手腕
- **手部** (17-22): 手掌各点
- **腿部** (25-28): 膝盖、脚踝
- **脚部** (29-32): 脚跟、脚趾

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Edge
- Safari (需要较新版本)

需要支持 WebGL 和 MediaStream API。

## 许可证

MIT
