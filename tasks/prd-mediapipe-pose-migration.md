# PRD: 迁移到 MediaPipe Pose 模型

## 1. Introduction/Overview

将现有的人体姿势识别系统从 TensorFlow.js MoveNet 模型完全迁移到 MediaPipe Pose 解决方案。目标是提高识别精度，同时保持 60 FPS 的流畅性能，并利用 MediaPipe 的世界坐标系统支持更复杂的姿势分析和应用场景。

## 2. Goals

- 完全移除 TensorFlow.js 和 MoveNet 依赖
- 集成 MediaPipe Pose 解决方案
- 提高关键点识别精度和稳定性
- 保持至少 60 FPS 的实时性能
- 利用 MediaPipe 的世界坐标系统（3D 坐标）
- 确保平滑的迁移过程，不影响现有功能
- 保持现有的 UI 和用户体验

## 3. User Stories

### US-001: 安装和配置 MediaPipe Pose 依赖
**Description:** 作为开发者，我需要安装 MediaPipe Pose 相关依赖包，以便进行后续集成。

**Acceptance Criteria:**
- [ ] 安装 `@mediapipe/pose` 包
- [ ] 安装 `@mediapipe/camera_utils` 包（可选，用于摄像头工具）
- [ ] 安装 `@mediapipe/drawing_utils` 包（可选，用于绘制工具）
- [ ] 移除 TensorFlow.js 相关依赖（@tensorflow/tfjs, @tensorflow-models/pose-detection, @tensorflow/tfjs-backend-webgl）
- [ ] 更新 package.json 并测试依赖安装成功
- [ ] Typecheck 通过

### US-002: 创建 MediaPipe Pose 服务层
**Description:** 作为开发者，我需要创建一个新的 MediaPipe Pose 服务来替代现有的 poseDetection.ts。

**Acceptance Criteria:**
- [ ] 创建 `src/services/mediapipeDetection.ts` 文件
- [ ] 实现 MediaPipe Pose 初始化逻辑
- [ ] 配置 MediaPipe Pose 参数（模型复杂度、平滑化等）
- [ ] 实现姿势检测函数，返回与现有接口兼容的数据格式
- [ ] 实现状态管理和监听器模式（与现有 API 兼容）
- [ ] 实现资源清理函数
- [ ] Typecheck 通过

### US-003: 适配骨架绘制服务
**Description:** 作为开发者，我需要更新骨架绘制服务以适配 MediaPipe 的数据格式。

**Acceptance Criteria:**
- [ ] 更新 `src/services/skeletonDrawing.ts` 以支持 MediaPipe 数据格式
- [ ] 确保正确绘制 33 个关键点（MediaPipe 使用 33 个，MoveNet 使用 17 个）
- [ ] 更新关键点连接定义（MediaPipe 的连接方式）
- [ ] 添加对新关键点的支持（脚部、手部细节等）
- [ ] 保持现有绘制样式和颜色方案
- [ ] Typecheck 通过

### US-004: 更新类型定义
**Description:** 作为开发者，我需要更新 TypeScript 类型定义以支持 MediaPipe 数据结构。

**Acceptance Criteria:**
- [ ] 更新 `src/types/pose.ts` 文件
- [ ] 定义 MediaPipe Pose 的关键点类型（包含 x, y, z, visibility）
- [ ] 定义世界坐标类型（3D 坐标）
- [ ] 保持与现有接口的兼容性
- [ ] Typecheck 通过

### US-005: 迁移 CameraView 组件
**Description:** 作为开发者，我需要更新 CameraView 组件以使用新的 MediaPipe 服务。

**Acceptance Criteria:**
- [ ] 更新 CameraView.vue 导入新的 MediaPipe 服务
- [ ] 移除 TensorFlow.js 相关代码
- [ ] 确保 FPS 监控功能正常工作
- [ ] 确保摄像头开关功能正常
- [ ] 确保骨架实时绘制功能正常
- [ ] 保持现有的 UI 布局和样式
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

### US-006: 性能优化和测试
**Description:** 作为开发者，我需要确保新实现在普通硬件上达到 60 FPS。

**Acceptance Criteria:**
- [ ] 在普通电脑（4核CPU, 集成显卡）上测试性能
- [ ] 确保稳定达到 60 FPS
- [ ] 优化 MediaPipe 配置参数（模型复杂度、分辨率等）
- [ ] 测试不同光照条件下的性能
- [ ] 测试不同动作速度下的性能
- [ ] 更新 FPS 监控显示以反映真实性能
- [ ] Typecheck 通过
- [ ] Verify in browser using dev-browser skill

### US-007: 清理旧代码和依赖
**Description:** 作为开发者，我需要移除所有 MoveNet 相关代码和配置。

**Acceptance Criteria:**
- [ ] 删除 `src/services/poseDetection.ts` 文件
- [ ] 从 package.json 中移除 TensorFlow.js 依赖
- [ ] 移除任何残留的 TensorFlow.js 导入
- [ ] 更新注释和文档
- [ ] 运行 `npm run type-check` 确保无错误
- [ ] 运行 `npm run build` 确保构建成功
- [ ] Typecheck 通过

### US-008: 更新文档和注释
**Description:** 作为开发者，我需要更新项目文档以反映 MediaPipe 迁移。

**Acceptance Criteria:**
- [ ] 更新 README.md 说明使用 MediaPipe Pose
- [ ] 更新代码注释
- [ ] 更新 PRD 文档
- [ ] 添加 MediaPipe 配置说明
- [ ] 添加性能调优建议
- [ ] Typecheck 通过

## 4. Functional Requirements

- FR-1: 系统必须使用 MediaPipe Pose 解决方案进行人体姿势识别
- FR-2: 系统必须识别 33 个关键点（比 MoveNet 多 16 个）
- FR-3: 系统必须提供世界坐标（3D 坐标）数据
- FR-4: 系统必须在普通硬件上稳定达到 60 FPS
- FR-5: 系统必须保持现有的 UI 布局和用户体验
- FR-6: 系统必须提供与现有 API 兼容的接口
- FR-7: 系统必须支持实时姿势检测和骨架绘制
- FR-8: 系统必须正确处理摄像头权限和错误
- FR-9: 系统必须提供模型加载进度指示
- FR-10: 系统必须提供 FPS 监控功能

## 5. Non-Goals (Out of Scope)

- **不实现** 模型切换功能（保留 MoveNet 作为备选）
- **不实现** 3D 可视化（虽然使用 3D 坐标，但仍然 2D 显示）
- **不实现** 姿势评分或纠正功能
- **不实现** 动作录制/回放功能
- **不实现** 多人识别（保持单人识别）
- **不实现** 背景分割或虚化功能
- **不改变** 现有的 UI 设计和布局
- **不改变** 现有的骨架颜色方案

## 6. Design Considerations

### UI/UX
- 保持现有的 UI 布局和样式
- 保持现有的骨架绘制样式（青色线条 + 红色关键点）
- FPS 监控显示保持不变
- 全屏模式功能保持不变

### 数据结构变化
**MoveNet (17 关键点):**
- nose, left_eye, right_eye, left_ear, right_ear
- left_shoulder, right_shoulder, left_elbow, right_elbow
- left_wrist, right_wrist, left_hip, right_hip
- left_knee, right_knee, left_ankle, right_ankle

**MediaPipe Pose (33 关键点):**
- 0-10: 面部（鼻子、眼睛、耳朵、嘴巴）
- 11-14: 肩膀和手肘
- 15-22: 手腕和手部
- 23-24: 髋部
- 25-32: 膝盖和脚踝

### 绘制适配
- 需要更新骨架连接定义
- 需要处理额外的手部和脚部关键点
- 需要处理面部关键点（可选绘制）

## 7. Technical Considerations

### MediaPipe Pose 配置参数
```javascript
{
  modelComplexity: 1, // 0, 1, or 2 (精度 vs 速度)
  smoothLandmarks: true, // 平滑化处理
  enableSegmentation: false, // 不启用分割
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
}
```

### 性能优化策略
1. **模型复杂度选择:** 使用 modelComplexity: 1（平衡精度和速度）
2. **分辨率优化:** 根据性能动态调整输入分辨率
3. **平滑化处理:** 启用 smoothLandmarks 减少抖动
4. **异步处理:** 确保 MediaPipe 回调不阻塞主线程

### 关键依赖版本
```json
{
  "@mediapipe/pose": "^0.5.1675469404",
  "@mediapipe/camera_utils": "^0.3.1675466862",
  "@mediapipe/drawing_utils": "^0.3.1675466124"
}
```

### 浏览器兼容性
- Chrome 90+ (推荐)
- Edge 90+ (推荐)
- 需要 WebGL 支持
- 需要 WebAssembly 支持

### 数据格式对比

**MoveNet 输出:**
```javascript
{
  keypoints: [
    { x: 100, y: 200, score: 0.9, name: "nose" },
    // ... 16 more
  ]
}
```

**MediaPipe Pose 输出:**
```javascript
{
  poseLandmarks: [
    { x: 0.5, y: 0.3, z: -0.1, visibility: 0.9 },
    // ... 32 more
  ],
  poseWorldLandmarks: [
    { x: 10, y: 20, z: -5, visibility: 0.9 },
    // ... 32 more (3D world coordinates)
  ]
}
```

### API 兼容性适配器
需要创建适配器函数，将 MediaPipe 数据格式转换为现有接口格式：
```typescript
// 将 MediaPipe 归一化坐标转换为像素坐标
function convertMediaPipeToPixels(landmark, canvasWidth, canvasHeight)

// 将 MediaPipe 数据结构转换为应用内部格式
function adaptMediaPipePose(mediapipeResult)
```

## 8. Success Metrics

- **识别精度:** 关键点定位误差 < 5px（相比 MoveNet 提升至少 20%）
- **性能指标:** 在普通硬件上稳定达到 60 FPS
- **稳定性:** 关键点抖动减少 30%（通过 smoothLandmarks）
- **延迟:** 从动作到显示的延迟 < 50ms
- **兼容性:** 在 Chrome 和 Edge 上无错误运行
- **功能完整性:** 所有现有功能正常工作
- **代码质量:** TypeScript 无类型错误，构建成功

## 9. Open Questions

- MediaPipe Pose 的 33 个关键点是否全部绘制，还是只绘制与 MoveNet 对应的 17 个？
- 世界坐标（3D 坐标）数据是否需要持久化或导出？
- 是否需要添加配置界面让用户调整 MediaPipe 参数？
- 面部关键点（0-10）是否需要绘制？
- 手部细节关键点（15-22）是否需要绘制？
- 是否需要显示置信度/可见性（visibility）信息？
- 迁移后是否需要进行 A/B 测试对比 MoveNet 和 MediaPipe 的性能？

---

## 附录: MediaPipe Pose 关键点索引

MediaPipe Pose 识别的 33 个关键点:
0. nose (鼻子)
1. left_eye_inner (左眼内角)
2. left_eye (左眼)
3. left_eye_outer (左眼外角)
4. right_eye_inner (右眼内角)
5. right_eye (右眼)
6. right_eye_outer (右眼外角)
7. left_ear (左耳)
8. right_ear (右耳)
9. mouth_left (左嘴角)
10. mouth_right (右嘴角)
11. left_shoulder (左肩)
12. right_shoulder (右肩)
13. left_elbow (左肘)
14. right_elbow (右肘)
15. left_wrist (左手腕)
16. right_wrist (右手腕)
17. left_pinky (左手小指)
18. right_pinky (右手小指)
19. left_index (左手食指)
20. right_index (右手食指)
21. left_thumb (左手拇指)
22. right_thumb (右手拇指)
23. left_hip (左髋)
24. right_hip (右髋)
25. left_knee (左膝)
26. right_knee (右膝)
27. left_ankle (左脚踝)
28. right_ankle (右脚踝)
29. left_heel (左脚跟)
30. right_heel (右脚跟)
31. left_foot_index (左脚尖)
32. right_foot_index (右脚尖)

骨架连接线:
- 面部: 0-1, 1-2, 2-3, 3-7, 0-4, 4-5, 5-6, 6-8, 8-9, 7-10
- 躯干: 11-12, 11-23, 12-24, 23-24
- 左臂: 11-13, 13-15, 15-17, 15-19, 15-21, 17-19
- 右臂: 12-14, 14-16, 16-18, 16-20, 16-22, 18-20
- 左腿: 23-25, 25-27, 27-29, 27-31, 29-31
- 右腿: 24-26, 26-28, 28-30, 28-32, 30-32
