# AGENT_CONTEXT.md

## 项目状态说明

当前项目已经完成：

- 产品定位；
    
- 页面视觉设计；
    
- 核心交互设计；
    
- Three.js 架构设计；
    
- Phase 1~8 工程实现（验收记录见下方"验收记录（Agent Execution Plan）"）。

当前阶段：

> 性能优化阶段。

下一步：

- 方案 1（像素比修正 + delta 钳制 + 标签页隐藏暂停）已完成并文档化（D026 / D027）；
- 方案 2（粒子动画 GPU 着色器化）已完成并文档化（D029），含粒子消失 bug 修复（D030），浏览器已确认粒子恢复可见；
- **D028（页面加载照片逐一浮现阶段卡顿）已修复**（D031）：`createImageBitmap` 离屏降采样 + 纹理上限 1024/768 + 并发队列限流（6 张/批），待浏览器/线上复验（拖动已流畅，绽放阶段预期不再掉帧）；
- 候选：方案 3 自适应分辨率。

# 项目快照

## 项目名称

DianRhyme

## 项目目标

为北京科技大学“酉良和音滇韵民族团结实践团”制作成果展示网站。

通过网页展示：

- 实践经历；
    
- 团队信息；
    
- 照片资料。
    

---

# 核心页面

## 精彩瞬间（Moments）

目标：

将传统图片展示升级为沉浸式 3D 照片宇宙。

核心理念：

> 用户不是浏览照片列表，而是在探索一段由照片组成的实践记忆。

---

# 技术栈

使用：

- Astro
    
- Three.js
    
- TypeScript / JavaScript
    
- CSS
    

不使用：

- React
    
- React Three Fiber
    
- 数据库
    
- 后台管理系统
    

原因：

当前项目是单页面展示项目，不需要额外框架复杂度。

---

# 页面结构

```
DianRhyme

src/pages/
└── moments.astro

        |
        ↓

Three.js Photo Universe

        |
        ↓

WebGL Canvas

        |
        ↓

Photo Nodes

        |
        ↓

用户探索 / 点击查看

```

---

# 视觉设计

## 主题

暖色记忆宇宙（Warm Memory Universe）

不是：

- 科幻宇宙；
    
- 游戏空间。
    

而是：

- 一本漂浮的相册；
    
- 一段可探索的回忆。
    

---

## 视觉元素

背景：

- 深暖色；
    
- 暗色调；
    
- 避免纯黑。
    

效果：

- 漂浮尘埃粒子；
    
- 柔和光晕；
    
- 照片节点；
    
- 缓慢漂浮。
    

---

# Decision Log

## D001

删除原 Gallery 页面。

新增：

Moments 页面。

原因：

传统图片展示无法体现项目特色。

---

## D002

采用 Three.js 3D 照片宇宙。

原因：

希望用户探索实践记忆空间。

---

## D003

照片节点直接显示照片。

原因：

照片本身是核心内容。

---

## D004

照片采用固定随机空间布局。

原因：

保持空间稳定。

---

## D005

照片数据独立管理。

位置：

```
src/data/moments.ts
```

原因：

添加照片无需修改页面代码。

---

## D006

空间坐标由程序生成。

原因：

当前照片规模无需人工布局。

---

## D007

使用原生 Three.js。

不引入 React Three Fiber。

原因：

避免增加不必要复杂度。

---

## D008

第一阶段直接加载原图。

原因：

优先验证体验。

未来：

可增加图片优化流程。

---

## D009

照片节点缓慢漂浮。

效果：

- 上下移动；
    
- 轻微旋转。
    

目的：

增强记忆流动感。

---

## D010

点击照片后保持 3D 空间查看。

流程：

```
点击照片

↓

镜头移动

↓

照片放大

↓

查看

↓

返回探索
```

---

## D011

照片空间采用完全随机布局。

原因：

增强探索未知空间的感觉。

不采用：

- 时间线；
    
- 主题区域；
    
- 中心结构。
    

---

## D012

照片靠近用户时自动朝向镜头。

效果：

远处：

保持随机角度。

近处：

自动正面展示。

---

## D013

进入页面增加短暂引导文字。

内容：

“探索我们的滇行记忆”

流程：

```
进入

↓

文字出现

↓

约2秒

↓

淡出

↓

探索
```

---

## D014

空间密度：

中等偏稀疏。

原因：

形成探索感。

---

## D015

第一阶段全部照片一次性加载。

原因：

照片数量规模可控。

未来：

增加 ImageLoader 支持懒加载。

---

## D016

用户探索方式：

Orbit 轨道探索。

交互：

- 鼠标拖动旋转；
    
- 滚轮缩放。
    

不采用：

Fly 自由飞行。

原因：

重点是观看照片，而不是操作空间。

---

# 验收记录（Agent Execution Plan）

来源：

- `E:\下载\DianRhyme_Agent_Execution_Plan.md` 第 8 节 GPT Review Protocol；
- 验收对象：Phase 1 至 Phase 8 全部，以及最终整体验收（计划第 9 节）。

结果：

- Phase 1 ACCEPT；
- Phase 2 ACCEPT；
- Phase 3 ACCEPT；
- Phase 4 ACCEPT；
- Phase 5 ACCEPT；
- Phase 6 ACCEPT；
- Phase 7 ACCEPT；
- Phase 8 ACCEPT；
- 最终整体验收 ACCEPT。

关键决策见 Decision Log D017 起。

---

## D017

数据层采用真实图片路径，而非计划建议的占位图。

位置：

```
src/data/moments.ts
```

说明：

使用 `${base}images/...`（`import.meta.env.BASE_URL`）引用既有真实照片资源。

原因：

项目已存在真实照片，直接引用避免占位图后续替换；同时遵守 base 前缀规范。

---

## D018

测试文件按模块拆分命名。

计划约定：

```
tests/layoutGenerator.test.ts
tests/core.test.ts
```

实际：

```
tests/layout.test.ts
tests/scene-manager.test.ts
tests/renderer.test.ts
tests/camera-manager.test.ts
tests/animation-loop.test.ts
```

原因：

便于单模块独立验证；vitest include 模式 `tests/**/*.test.ts` 自动收集，命名不影响运行。

---

## D019

moments 页面接线抽到 main.ts 组合根。

文件：

```
src/three/main.ts
```

说明：

`initUniverse(container)` 创建 Scene / Camera / Renderer / AnimationLoop 并挂载，`moments.astro` 仅调用单函数。比计划要求超出 1 个文件（+main.ts）。

原因：

保持 astro 薄层，Three.js 装配逻辑收口到 main.ts；便于测试与复用。

---

## D020

THREE.Clock 已弃用。

现象：

运行正常，但 stderr 提示：

```
THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

原因：

three.js 新版弃用 Clock、推荐 Timer；功能不受影响，非阻断性，待后续阶段择机替换。

---

## D021

验收期间 camera-manager.test.ts 用例数从 5 个变为 1 个。

现象：

全量测试由 33 tests（19:46）变为 29 tests（19:53）。

说明：

当前磁盘状态仅保留 CameraManager 基础创建用例，与 Phase 2 范围一致。

原因：

仓库状态在运行间隙发生外部改动；Phase 6 需按 C-04 补状态机用例。

---

## D022

PhotoManager 测试用 3 个 mock moments，计划原写 5 个。

说明：

- 不变式等价：`nodes.length === moments.length`（`photoManager.test.ts:28`）已断言；
- 计划要求的"空数组 moments=[] 边界用例"尚未写入测试文件，仅手工临时验证通过（nodes 为空、不抛异常）。
- 验收期间 `tests/photo-node.test.ts` 消失、`tests/photo-manager.test.ts` 被重命名为 `tests/photoManager.test.ts`（与计划命名一致）。

原因：

非强制数值差异，不改变契约语义；空数组用例建议后续补入。

---

## D023

Phase 4 三项针对性用例未写入测试文件，改用"临时探测 + 代码核对"验收。

说明：

- floatOffset 随机初始化生效：确定性随机序列造两节点，相位不同 → 产生 >2 个不同 y 值；
- `update(deltaTime=1, elapsedTime=0)` 后 `y === baseY`：mock `Math.random()=0`（floatOffset=0）精确成立；
- `faceCamera` 等距边界：实现用 `<=`，距离恰等于 threshold 时触发 lookAt（`dot≈1`），仅超过时保持原朝向（`dot<-0.9`）。
- `photoManager.test.ts` 内仅有近(3)/远(50)两组 D012 断言，未含上述三项。

关键决策：

- **等距边界语义**：`faceCamera` 采用 `<=`，即"恰好等于阈值时转向镜头"，已二选一写死（`PhotoNode.ts:41`）。

原因：

实现公式与计划一字不差（`y = baseY + sin(elapsed·floatSpeed + floatOffset)·0.3`），探测全部通过；三项用例建议后续补入测试文件。

---

## D024

Raycaster 用 2 个 mock PhotoNode（计划原写 3 个）。

说明：

- 不变式等价：不同位置节点 + 射线正对中心 → `pick` 返回对应节点；换序反向查找命中正确节点（`raycaster.test.ts:37,43`）；
- 契约边界：角落 miss 与空数组均返回 `null`（`:49,55`）；
- 已采纳计划备用方案：`pick` 内部自建 `mesh→PhotoNode` Map，未修改 PhotoNode、未加 `userData`；
- 采纳 `PickEvent` 接口使 `pick` 可脱离 DOM 测试。

构建：

`npm run build` 通过，`/moments` 页生成无错，但 three.js chunk 535KB（gzip 136KB）触发 >500kB 警告。

人工检查项（待确认）：

- 拖动旋转 / 滚轮缩放 / 松手阻尼感；
- 点击照片 → console 输出正确照片 id。

原因：

非强制数值差异；打包体积留给后续优化阶段处理（计划已明确本阶段不做懒加载/压缩）。

---

## D025

CameraManager 初始状态为 EXPLORING，进入页面时由 main.ts 显式 `setState(ENTERING)`。

说明：

- 计划 Phase 8 原文描述"初始状态即为 ENTERING"；
- 实际实现：`_state = UniverseState.EXPLORING`（`CameraManager.ts:25`），`main.ts:57` 在 `bindControls` 后立即 `setState(ENTERING)`。

原因：

行为等价——引导阶段（2 秒内）`controls.enabled = false` 仍成立（`camera-manager.test.ts:40` 已断言）；初始值 EXPLORING 使状态机默认中立，进入动画由页面引导显式触发，避免实例化即锁定。已二选一写死。

---

## D026

Renderer 实际渲染像素比从"无条件 cap"改为 `min(devicePixelRatio, cap)`。

文件：

```
src/three/core/Renderer.ts
```

说明：

`resize()` 时 `setPixelRatio(Math.min(Math.max(1, dpr), cap))`；`dpr` 由可注入的 `pixelRatioSource()` 提供（默认读 `window.devicePixelRatio || 1`，node 测试环境返回 1），不引入 `window` 强依赖。`main.ts` 传参不变（`tier.pixelRatioCap` 桌面 2 / 移动 1.75 未动）。

原因：

DPR=1 屏幕（如 Windows 1080p）原被无条件拉到 2×（4 倍像素量）再降采样，纯为抗锯齿浪费填充率，是桌面整体掉帧的最大单一来源。已更新 `tests/renderer.test.ts` 注入 DPR=1/2/3 验证低值取 DPR、高值封顶。

---

## D027

AnimationLoop 引入 delta 钳制与标签页隐藏暂停。

文件：

```
src/three/core/AnimationLoop.ts
```

说明：

- `MAX_DELTA = 0.05`，自持 `elapsed` 累加器，回调签名 `(delta, elapsed)` 不变，`main.ts` 无需改动；
- `start()` 丢弃 clock 陈旧累积（`getDelta()` 一次），保证恢复后首帧 delta≈0，不跳变；
- 监听 `document.visibilitychange`：隐藏→`stop()`，可见→`start()` 恢复；监听常驻（`visibilityBound` 守卫，仅绑定一次），`stop()` 语义为"暂停"而非销毁，故不移除监听，否则首次隐藏后无法恢复。

原因：

切标签/GC/DevTools 停顿后原始 delta 可达数百毫秒，粒子漂移、聚焦镜头 lerp、Orbit 阻尼随之跳变；隐藏期间循环空转浪费 CPU。node 无 DOM，已加 `typeof document !== 'undefined'` 守卫。

---

## D028

性能优化方案 1 / 方案 2 落地后的遗留问题：**页面加载时照片逐一浮现阶段卡顿**。

现象（用户实测定位，2026-08-13）：

- 点击导航栏"精彩瞬间"跳转进入页面后，先出现引导文字"探寻我们的滇行记忆"——**不卡**；
- 紧接着照片**一张一张浮现（bloom 绽放）时非常卡**；
- 拖动旋转、滚轮缩放已流畅（方案 1 + 方案 2 生效）。

结论：卡顿集中在"照片绽放动画 + 图片解码/纹理上传"的加载窗口期，而非渲染循环本身。

假设：

- 约 23 张图片经 `loadScaledImage` 的 `ctx.drawImage` 同步主线程降采样（`LoadScaledTexture.ts:70`），随后纹理上传 + mipmap 生成为一次性长任务，与绽放动画争抢主线程；
- 绽放动画与图片就绪耦合（`PhotoNode` 逐个 `ready` 触发 `beginIntro`），每个 ready 都会推开新的纹理上传/着色；
- 主线程被降采样 + 上传阻塞时，rAF 帧率骤降，叠加 `easeOutBack` 绽放动画显眼放大掉帧感。

下一步（候选，未定方案）：

- 图片加载分批/异步：`img.decode()` 异步解码、`requestIdleCallback` 调度降采样，避开主线程峰值；
- bloom 动画与纹理上传解耦：先用占位缩放绽放，纹理就绪后替换，消除"上传 → 绽放"耦合长任务；
- 降采样尺寸再收紧（移动端 1024 → 更低），减少 drawImage 耗时。

状态：待下一轮优化讨论决策。

---

## D029

粒子动画从 CPU 每帧循环改为 GPU 顶点着色器驱动（方案 2）。

文件：

```
src/three/effects/Particles.ts
src/three/main.ts
tests/particles.test.ts
```

说明：

- `PointsMaterial` → `ShaderMaterial`，uniforms `uTime / uOpacity / uSize / uViewportHeight`；
- 位置漂移（±0.5 / 0.4 / 0.5，角速度 0.4 / 0.3 / 0.25）移入 vertex shader，相位由 position 伪随机哈希生成，不新增 attribute；
- `gl_PointSize = uSize * uViewportHeight * 0.5 * projectionMatrix[1][1] / -mvPosition.z`，与原 `PointsMaterial size=0.07 + sizeAttenuation` 数学等价；
- 片元着色器软圆点（`gl_PointCoord` + smoothstep）+ 呼吸透明度（`uOpacity ∈ [0.50, 0.80]`）；
- 删除 `basePositions` WeakMap 与逐粒子 `needsUpdate` 整块 buffer 重传，每帧 CPU 开销近乎归零；
- 新增 `Particles.syncViewport(points, viewportHeight)`，`main.ts` 渲染循环内传 `gl.domElement.height`（drawing buffer 高，含 DPR，自动跟随 resize）。

原因：

550 粒子 × 3 轴 sin/cos 约 1650 次/帧 + 1650 float buffer 上传是每帧最大 CPU 固定开销，GPU 化后完全卸载。

---

## D030

three.js ShaderMaterial 前缀自动声明 `attribute vec3 position;`，不得在用户 shader 中重复声明。

现象：

方案 2 首次落地后**所有粒子消失**（照片正常）。原因：`WebGLProgram.js:623` 为 ShaderMaterial（非 RawShaderMaterial）注入 `attribute vec3 position;`（WebGL2 下经 `#define attribute in` 转成 `in vec3 position;`），自定义 vertex shader 再声明同名 attribute → GLSL 重复定义 → 编译失败 → 整个粒子材质被跳过。

修复：

- `Particles.ts` vertex shader 删除 `attribute vec3 position;`，保留 `attribute vec3 color;`（前缀仅在 `USE_COLOR` 下声明 color，ShaderMaterial 默认不定义，必须自行声明）；
- 新增回归测试：断言 vertex shader 不含 `position/normal/uv` 重复声明、含 `color` 声明；
- 浏览器复验：粒子恢复可见，尺寸与原版一致。

教训：自定义 ShaderMaterial 时 position/normal/uv 由 three 提供，直接使用；仅需声明 three 未覆盖的 attribute/uniform。

---

## D031

"页面加载时照片逐一浮现阶段卡顿"（D028）根因与修复——加载/绽放窗口期去卡顿（三件套）。

现象（用户实测）：点导航进入"精彩瞬间"→ 引导文字阶段不卡 → 照片一张一张 bloom 绽放时**非常卡**，每张浮现都伴随一次明显掉帧。

根因：

- moments 页实际加载 **35 张图**，其中约 20 张边长 >2000px，多张高达 8192×4608 / 8064×6048 / 6000×3376、单张 10-13MB（实测 `public/images/` 各图尺寸）；
- 旧路径 `loadScaledImage`（`LoadScaledTexture.ts:70`）在**主线程** `ctx.drawImage` 同步降采样，8000×6000→2048 每张数十 ms；
- `CanvasTexture needsUpdate` + **bloom 与纹理就绪强耦合**（`PhotoNode.beginIntro` 在 fireReady 时触发）：每张照片浮现的那一帧恰好撞上它自己的重降采样 + 纹理上传 + mipmap 生成 → 一帧一个卡点；
- 35 张图**同步全部发起**下载/解码，多张大图几乎同时下完 → 一串 drawImage 长任务排队 → rAF 饿死 → 掉帧；
- 2048 目标对实际显示尺寸（探索 ~200px、聚焦 ~830px）严重过剩。

修复（三件套，文件见下）：

1. **降采样移出主线程**：`loadImageBitmap` 用 `fetch → blob → createImageBitmap(blob, { resizeWidth/Height, resizeQuality:'high' })`，解码+缩放全在浏览器 worker 完成，主线程零 drawImage；超大图先解码取尺寸、再二次离屏缩放，原 canvas 路径（`loadScaledImage`）保留为兜底（`createImageBitmap`/`fetch` 不可用或失败时回退）；
2. **纹理上限收紧**：桌面 `maxTextureEdge` 2048→**1024**、移动 1024→**768**（聚焦视角 ~830px，1024 足够；移动聚焦 ~168px，768 富余），上传/mipmap/显存降为 ~1/4；
3. **加载并发限流**：`createPacedTextureLoader` 带并发上限的异步队列（`main.ts` 用 `LOAD_CONCURRENCY=6`），消除大图集中突发，照片更均匀地逐一浮现。

文件：

```
src/three/utils/LoadScaledTexture.ts   // loadImageBitmap / createPacedTextureLoader / TextureSource
src/three/main.ts                      // 接 createPacedTextureLoader(maxEdge, concurrency=6)
src/three/utils/DeviceTier.ts          // maxTextureEdge 2048→1024 / 1024→768
tests/scaled-texture.test.ts           // loadImageBitmap 3 例 + 并发队列 2 例
tests/device-tier.test.ts              // 纹理上限断言更新
```

验证：全量 `npm test` → 13 文件 / **85 tests** 通过；`npm run build` 通过。

---

## D032

`createImageBitmap` 离屏路径引入的回归：**所有照片上下颠倒**。

现象：D031 落地后浏览器实测照片全部上下颠倒。

根因：three.js 对 `ImageBitmap` 纹理来源**跳过** `UNPACK_FLIP_Y_WEBGL`（`WebGLTextures.js` 的 `isImageBitmap` 分支，0.185.1 第 918-930 行），而 canvas 路径（`CanvasTexture` + flipY=true）会翻转。WebGL 规范规定 `UNPACK_FLIP_Y_WEBGL` 对 `ImageBitmap` 来源无效果，three 文档亦注明 flipY 对 ImageBitmap 无效、须在 `createImageBitmap` 时用 `imageOrientation` 预翻转。故 bitmap 以未翻转状态上传 → 与 three 默认采样（v=0 在平面底部）叠加 → 上下颠倒。

修复：

- `loadImageBitmap` 最终返回的 bitmap 一律加 `imageOrientation: 'flipY'` 预翻转：
  - 大图：`createImageBitmap(source, { resizeWidth/Height, resizeQuality:'high', imageOrientation:'flipY' })`；
  - 小图（不缩放）：额外一次 `createImageBitmap(source, { imageOrientation:'flipY' })`；
- 首步解码保留默认 `from-image`（应用 EXIF 方向），翻转在第二步对已解码 bitmap 进行，避免破坏带 EXIF 旋转照片的方向；
- 回归测试：断言缩放路径 `imageOrientation:'flipY'` 存在、小图路径多一次 flip 调用。

验证：全量 `npm test` → 13 文件 / **85 tests** 通过；`npm run build` 通过；浏览器复验照片方向正常。

---

# 最终整体验收记录

对照计划第 9 节 Review Checklist，日期 2026-08-12：

## 自动验证

- 全量测试：`npx vitest run` → **11 文件 / 50 tests 全部通过**；
- 构建：`npm run build` → dist 生成，`/moments` 无报错；
- 图片资源：moments.ts 12 条 `src` 引用路径全部存在（`posts/7.10~8.8` + `team-photo.jpg`）。

## 审查清单

架构质量：

- PhotoNode 未触碰 Camera（faceCamera 仅接收 camera 参数；getFocusPosition 只返回坐标）；
- FocusController 只负责摄像机移动，不创建/持有 PhotoNode；
- C-04 控制权互斥闭环：`controls.enabled` 仅出现在 `Controls.ts:22` 与 `CameraManager.ts:60`，FocusController 全走 `setState`。

代码质量：

- 无 `any`（仅 `PickEvent.target?: unknown`，更窄类型）；
- 无未处理 Promise；
- 常量全部模块顶部集中（FOCUS_DURATION / VIEW_DISTANCE / FLOAT_AMPLITUDE / DEFAULT_PARTICLE_COUNT 等）。

契约一致性：

- C-01 ~ C-06 六项契约逐条比对无签名漂移；
- `UniverseState` 四态 + 宽松状态机行为与计划一致。

潜在 Bug：

- 风险点1（照片 >30 告警）：`main.ts:47-49` 生效；
- 风险点2（LayoutGenerator 死循环）：maxRetries 有界 + 测试覆盖；
- 风险点3（FOCUSING 彻底禁用 Orbit）：`syncControls` 仅 EXPLORING 启用 + main.ts 额外限制 `controls.update()`；
- 超计划改进项（新）：caption 照片说明卡、hint 交互提示、返回按钮，均已接入状态机。

## 待确认 / 遗留

- Git 工作流（计划第 7 节）：所有 Phase 产物仍 untracked，未按 `Phase N:` 提交，亦未删除三处 gallery 文件的提交；**用户决定不执行 git**；
- 人工浏览器验收：旋转阻尼 / 滚轮缩放 / 点击聚焦 / 2 秒引导淡出，待本地 `npm run dev` 确认；
- 非阻断项：THREE.Clock 弃用警告（D020）、chunk 535KB（D024）。

---

# Three.js 工程架构

目录：

```
src/three/

├── main.ts

├── core/
│   ├── SceneManager.ts
│   ├── CameraManager.ts
│   ├── Renderer.ts
│   └── AnimationLoop.ts

├── photos/
│   ├── PhotoNode.ts
│   ├── PhotoManager.ts
│   └── LayoutGenerator.ts

├── effects/
│   ├── Particles.ts
│   └── Atmosphere.ts

├── interaction/
│   ├── Controls.ts
│   ├── Raycaster.ts
│   └── FocusController.ts

└── utils/
    └── MathUtils.ts

```

---

# 模块职责

## core

负责 Three.js 基础环境。

### SceneManager

负责：

- Scene 创建；
    
- Object 添加。
    

不负责：

- 照片逻辑；
    
- 用户交互。
    

---

### CameraManager

负责：

- 摄像机；
    
- 镜头移动。
    

支持：

- 探索状态；
    
- 聚焦状态。
    

---

### Renderer

负责：

- WebGLRenderer；
    
- Canvas；
    
- resize。
    

---

### AnimationLoop

负责：

统一动画循环。

管理：

- PhotoNode 动画；
    
- 粒子动画；
    
- 镜头动画。
    

---

# photos

## PhotoManager

管理所有照片节点。

职责：

```
读取 moments.ts

↓

创建 PhotoNode

↓

加入 Scene

↓

统一更新
```

---

## PhotoNode

代表：

空间中的一张照片。

职责：

### 创建照片

流程：

```
图片

↓

Texture

↓

PlaneGeometry

↓

Mesh

```

---

### 漂浮动画

保存：

```
baseY
floatSpeed
floatOffset
```

---

### 朝向控制

提供：

```
faceCamera(camera)
```

---

### 聚焦支持

提供：

```
getFocusPosition()
```

不负责：

摄像机移动。

---

## LayoutGenerator

负责：

自动生成照片空间坐标。

输入：

照片数量。

输出：

```
[
{x,y,z},
{x,y,z}
]
```

要求：

- 随机；
    
- 避免重叠；
    
- 控制密度。
    

---

# interaction

## Controls

采用：

Three.js OrbitControls。

负责：

- 旋转；
    
- 缩放。
    

---

## Raycaster

负责：

检测用户点击照片。

流程：

```
鼠标点击

↓

二维坐标

↓

射线检测

↓

返回 PhotoNode

```

---

## FocusController

负责：

点击后的镜头动画。

例如：

```
当前 Camera

↓

目标照片位置

↓

平滑移动

```

---

# 数据设计

文件：

```
src/data/moments.ts
```

只保存照片信息。

结构：

```typescript
interface Moment {

 id:string;

 src:string;

 title?:string;

 description?:string;

 date?:string;

 location?:string;

}

```

不保存：

- position；
    
- rotation；
    
- scale。
    

原因：

数据和空间布局分离。

---

# 页面加载流程

```
用户进入 moments 页面

↓

moments.astro 初始化

↓

main.ts

↓

创建 Scene

↓

创建 Camera

↓

创建 Renderer

↓

读取 moments.ts

↓

LayoutGenerator生成坐标

↓

创建 PhotoNode

↓

加入 Scene

↓

加载粒子效果

↓

执行进入飞入动画

↓

进入探索状态

```

---

# 状态设计

```typescript
enum UniverseState {

 ENTERING,

 EXPLORING,

 FOCUSING,

 VIEWING

}

```

说明：

ENTERING：

进入动画。

EXPLORING：

自由探索。

FOCUSING：

镜头移动到照片。

VIEWING：

查看照片。

---

# 开发阶段

## Phase 1：最小可用版本

目标：

看到照片宇宙。

实现：

- moments.ts
    
- Scene
    
- Camera
    
- Renderer
    
- LayoutGenerator
    
- PhotoNode
    

---

## Phase 2：视觉增强

增加：

- 自动飞入动画；
    
- 漂浮效果；
    
- 粒子；
    
- 暖色氛围。
    

---

## Phase 3：交互完善

增加：

- 点击照片；
    
- 镜头聚焦；
    
- 返回探索。
    

---

## Phase 4：优化

增加：

- 图片优化；
    
- 性能检查；
    
- 移动端适配。
    

---

# 当前状态

已完成：

[x] 项目定位

[x] 页面功能设计

[x] 视觉方案

[x] 交互方案

[x] 数据结构

[x] Three.js 架构

[x] 模块职责

当前：

工程实现准备完成。

---

# 下一步任务

进入：

## Agent Plan 制定

要求：

- 分阶段开发；
    
- 每阶段验证；
    
- 避免一次性生成全部代码；
    
- 保持模块边界。
    

下一次从：

“制定 Three.js 实现 Agent Plan”

开始。