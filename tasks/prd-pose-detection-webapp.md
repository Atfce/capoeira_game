# PRD: 人体姿势识别网页应用 (Pose Detection Web App)

## 1. Introduction/Overview

创建一个基于 Vue 3 和 TypeScript 的单页应用(SPA),使用电脑摄像头实时捕获用户画面,通过 TensorFlow.js/MoveNet 进行人体姿势识别,并在画面上实时绘制人体骨架。该应用主要用于游戏/娱乐互动场景,目标是达到 60 FPS 的流畅体验。

## 2. Goals

- 构建支持 Chrome 和 Edge 的 Vue 3 + TypeScript SPA
- 通过 Web API 调用电脑摄像头并实时显示视频流
- 集成 TensorFlow.js/MoveNet 进行实时人体姿势识别
- 在视频画面上绘制清晰的人体骨架/关键点
- 实现至少 60 FPS 的流畅运行性能
- 在识别速度和精度之间保持平衡

## 3. User Stories

### US-001: 项目初始化和技术栈搭建
**Description:** 作为开发者,我需要初始化 Vue 3 + TypeScript 项目,以便后续开发姿势识别功能。

**Acceptance Criteria:**
- [ ] 使用 Vite 创建 Vue 3 + TypeScript 项目
- [ ] 配置 TypeScript 严格模式
- [ ] 安装并配置核心依赖: TensorFlow.js, @tensorflow-models/pose-detection
- [ ] 项目能够成功运行 `npm run dev` 并显示默认页面
- [ ] Typecheck 通过 (`npm run type-check`)

### US-002: 摄像头访问和视频流显示
**Description:** 作为用户,我想要授权并看到我的摄像头画面,以便后续进行姿势识别。

**Acceptance Criteria:**
- [ ] 页面有"开启摄像头"按钮,点击后请求摄像头权限
- [ ] 成功获取摄像头视频流并显示在页面上
- [ ] 视频元素自动适配容器大小(响应式)
- [ ] 错误处理:如果用户拒绝或摄像头不可用,显示友好的错误提示
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

### US-003: TensorFlow.js 和 MoveNet 模型加载
**Description:** 作为开发者,我需要加载 MoveNet 模型,以便进行人体姿势识别。

**Acceptance Criteria:**
- [ ] 在组件挂载时自动加载 MoveNet 模型(使用 Lightning 或 Thunder 变体)
- [ ] 显示模型加载进度指示器
- [ ] 模型加载成功后才能开始姿势识别
- [ ] 模型加载失败时显示错误信息
- [ ] Typecheck 通过

### US-004: 实时姿势识别和骨架绘制
**Description:** 作为用户,我想要看到我的人体骨架实时绘制在视频画面上,以便获得互动体验。

**Acceptance Criteria:**
- [ ] 每一帧视频都进行姿势识别
- [ ] 在视频画面上绘制清晰可见的骨架关键点和连接线
- [ ] 骨架颜色与视频背景有明显对比
- [ ] 当用户移动时,骨架实时跟随更新
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

### US-005: 性能优化达到 60 FPS
**Description:** 作为用户,我想要流畅的 60 FPS 体验,以便获得良好的游戏互动感。

**Acceptance Criteria:**
- [ ] 使用 requestAnimationFrame 优化渲染循环
- [ ] 使用 Lightning 变体的 MoveNet 模型(优先速度)
- [ ] Canvas 绘制不阻塞主线程
- [ ] 实现帧率监控并显示在页面角落
- [ ] 在普通电脑(4核CPU,集成显卡)上稳定达到 60 FPS
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

### US-006: 响应式布局和 UI 优化
**Description:** 作为用户,我想要在不同屏幕尺寸下都能良好使用应用,以便在不同设备上体验。

**Acceptance Criteria:**
- [ ] 支持全屏模式(浏览器 F11)
- [ ] 视频和骨架在窗口大小改变时自动调整
- [ ] 移动端也能使用(虽然主要支持桌面)
- [ ] UI 控件布局合理,不遮挡主要视频区域
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

## 4. Functional Requirements

- FR-1: 应用必须使用 Vue 3 Composition API 和 TypeScript
- FR-2: 应用必须通过 `navigator.mediaDevices.getUserMedia()` 访问摄像头
- FR-3: 必须使用 TensorFlow.js 的 `@tensorflow-models/pose-detection` 包和 MoveNet 模型
- FR-4: 必须在 HTML5 Canvas 上绘制骨架(关键点 + 连接线)
- FR-5: 必须绘制至少 17 个关键点(鼻子,眼睛,耳朵,肩膀,肘部,手腕,髋部,膝盖,脚踝)
- FR-6: 必须使用 `requestAnimationFrame` 进行渲染循环
- FR-7: 必须显示实时 FPS 计数器
- FR-8: 必须在 Chrome 90+ 和 Edge 90+ 上测试通过
- FR-9: 必须提供摄像头权限请求的错误处理和用户提示
- FR-10: 骨架绘制必须使用高对比度颜色(建议: 青色/绿色骨架,红色关键点)

## 5. Non-Goals (Out of Scope)

- **不支持** Safari 和 Firefox 浏览器
- **不包含** 姿势评分或纠正功能
- **不包含** 动作录制/回放功能
- **不包含** 预设动作对比功能
- **不包含** 用户登录或数据持久化
- **不包含** 多人识别(仅单人)
- **不包含** 后端服务器

## 6. Design Considerations

### UI 布局
- 主视频区域占据大部分屏幕空间
- 顶部或角落放置控制按钮(开启/关闭摄像头)
- FPS 计数器显示在右上角,半透明背景
- 骨架线条粗细: 3-5px
- 关键点圆圈半径: 5-8px

### 颜色方案
- 背景: 深色主题(可选浅色)
- 骨架线条: 青色 (#00FFFF) 或绿色 (#00FF00)
- 关键点: 红色 (#FF0000) 或橙色 (#FF6600)

## 7. Technical Considerations

### 核心技术栈
- **Frontend Framework:** Vue 3 (Composition API)
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **ML Library:** TensorFlow.js (@tensorflow/tfjs)
- **Pose Model:** MoveNet (Lightning variant for speed)
- **Browser APIs:** MediaDevices API, Canvas API

### 性能优化策略
1. **模型选择:** 使用 MoveNet Lightning(最快)而非 Thunder(更准但慢)
2. **渲染循环:** 使用 `requestAnimationFrame` 而非 `setInterval`
3. **Canvas 绘制:** 最小化绘制操作,只绘制可见元素
4. **内存管理:** 避免在渲染循环中创建新对象
5. **异步处理:** 确保 TensorFlow.js 推理不阻塞 UI 线程

### 浏览器兼容性
- Chrome 90+ (推荐)
- Edge 90+ (推荐)
- 需要支持 WebRTC 和 WebGL

### 关键依赖版本
```json
{
  "vue": "^3.4.0",
  "@tensorflow/tfjs": "^4.17.0",
  "@tensorflow-models/pose-detection": "^2.1.0",
  "@tensorflow/tfjs-backend-webgl": "^4.17.0"
}
```

## 8. Success Metrics

- **性能指标:** 在普通硬件上稳定达到 60 FPS (帧率监控显示)
- **识别准确度:** 在正常光线下,17 个关键点中至少 14 个被正确识别
- **延迟:** 从用户移动到骨架更新的延迟 < 50ms
- **用户体验:** 摄像头开启后 3 秒内开始显示骨架
- **兼容性:** Chrome 和 Edge 最新版本上无错误运行

## 9. Open Questions

- 是否需要支持不同的骨架颜色主题(用户可选)?
- 是否需要添加骨架透明度调节功能?
- 如果用户有多台摄像头,是否需要切换摄像头功能?
- 是否需要支持横屏/竖屏自适应(移动设备)?
- FPS 目标是否包括模型推理时间,还是仅指渲染帧率?

---

## 附录: MoveNet 关键点索引

MoveNet 识别的 17 个关键点:
0. 鼻子 (nose)
1. 左眼 (left_eye)
2. 右眼 (right_eye)
3. 左耳 (left_ear)
4. 右耳 (right_ear)
5. 左肩 (left_shoulder)
6. 右肩 (right_shoulder)
7. 左肘 (left_elbow)
8. 右肘 (right_elbow)
9. 左手腕 (left_wrist)
10. 右手腕 (right_wrist)
11. 左髋 (left_hip)
12. 右髋 (right_hip)
13. 左膝 (left_knee)
14. 右膝 (right_knee)
15. 左脚踝 (left_ankle)
16. 右脚踝 (right_ankle)

骨架连接线:
- 头部: 0-1, 0-2, 1-3, 2-4
- 躯干: 5-6, 5-11, 6-12, 11-12
- 左臂: 5-7, 7-9
- 右臂: 6-8, 8-10
- 左腿: 11-13, 13-15
- 右腿: 12-14, 14-16
