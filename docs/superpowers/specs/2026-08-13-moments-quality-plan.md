# Moments 页「品质优先」优化 — Agent 执行计划

**日期**：2026-08-13
**状态**：✅ 已实现并通过自动测试 + 构建 + Playwright 人工验收
**范围**：`/DianRhyme/moments`（Three.js 3D 照片宇宙）
**目标**：保留并深化「暖色记忆宇宙」概念，把执行做精。**优先解决**：高 DPI 模糊、12 张原图一次性全量解码进 GPU（最大 11.4MB）、缺失的入场飞入动画（对齐设计文档 D010）、移动端无降级、加载/空态缺失、无障碍与 reduced-motion 未落实。

---

## 0. 决策摘要（已与需求方确认）

| 决策 | 内容 |
|---|---|
| 核心概念 | 保留 3D 照片宇宙，不做结构性改造 |
| 入场方案 | **「就绪即绽放」**：照片初始 scale=0，纹理加载完成即触发 easeOutBack 绽放（错峰随机小延迟）；加载先完成者先点亮，形成「点亮记忆」渐进感 |
| 移动端 | 专门适配：降级参数 + 触屏提示 + 小屏布局 |
| 墙外修正 | 顺带修复 `content/posts/8.8.md:3` 的 `tittle`→`title` 拼写错误 |

**不做**（留给后续「沉浸强化 B」/「健壮性 C」）：hover 微交互、火塘炭火意象、chunk 体积优化（D024）、THREE.Clock 弃用（D020）。

### 本 plan 的唯一记忆点（signature）
「就绪即绽放」——照片随纹理就绪逐个点亮，与「暖色记忆宇宙 / 点亮记忆」的文化意象一致，同时天然解决加载空窗感。

---

## 1. 技术约束（必须遵守）

1. **base 子路径**：site 部署于 `/DianRhyme/`（`astro.config.mjs:6`）。`.astro` 中资源一律 `import.meta.env.BASE_URL + '...'`；`src/data/moments.ts` 已用 `${base}images/...`，**不改**。
2. **测试环境是 node（无 DOM）**（`vitest.config.ts`: `environment: 'node'`，`include: ['tests/**/*.test.ts']`）。**任何碰浏览器 API（Image / canvas / matchMedia / window）的新代码必须：**
   - 抽成纯函数（依赖注入），使 node 下可测；
   - 或保持"默认路径不触发浏览器 API"，由 `main.ts` 仅浏览器端注入触发。
3. **现有测试零破坏**：`tests/photoManager.test.ts` 用 `vi.mock('three')` 把 `TextureLoader.load` 换成同步假对象。`PhotoNode` 的**默认 loader 必须保持现有 `new THREE.TextureLoader().load(...)` 行为**（同步、不触发 Image），否则测试即崩。
4. **无 lint / typecheck / test 脚本的强制约束**：项目无 `lint`/`typecheck` 命令；验证 = `npm test`（vitest）+ `npm run build`。
5. AGENTS.md：**只做清单内改动**，不新增计划外文件、不动无关文档（changelog 等）。

---

## 2. 新增模块与接口契约

### 2.1 `src/three/utils/DeviceTier.ts`（新增，纯函数）

```ts
export interface TierInput {
  dpr: number;            // window.devicePixelRatio || 1
  width: number;          // document.documentElement.clientWidth
  coarsePointer: boolean; // matchMedia('(pointer: coarse)').matches
  reducedMotion: boolean; // matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface DeviceTier {
  isMobile: boolean;
  isTouch: boolean;       // == coarsePointer
  reducedMotion: boolean;
  pixelRatioCap: number;
  maxTextureEdge: number;
  particleCount: number;
  antialias: boolean;
}

export function resolveTier(input: TierInput): DeviceTier
```

**规则**：
- `isMobile = width < 768 && coarsePointer`
- 桌面：`pixelRatioCap=2, maxTextureEdge=2048, particleCount=400, antialias=true`
- 移动：`pixelRatioCap=1.75, maxTextureEdge=1024, particleCount=120, antialias=false`
- `isTouch = coarsePointer`；`reducedMotion` 原样透传

### 2.2 `src/three/utils/LoadScaledTexture.ts`（新增）

```ts
export function computeScaledSize(width, height, maxEdge): { width; height; scaled: boolean }
// 纯函数：max(width,height)<=maxEdge → scaled=false 原样返回；
// 否则等比缩小，长边=maxEdge，宽高取整，且 Math.max(1, ...) 防 0

export interface ImageDeps {
  Image: { new (): { decoding?: string; src: string; onload: (() => void) | null;
                     onerror: (() => void) | null; naturalWidth: number; naturalHeight: number } };
  document: { createElement(tag: string): { width: number; height: number;
             getContext(type: string, opts?: unknown): { drawImage(i: unknown, x: number, y: number, w: number, h: number): void } | null } };
}

export function loadScaledImage(url, maxEdge, deps: ImageDeps = defaultImageDeps()): Promise<HTMLImageElement | HTMLCanvasElement>
// 1) new deps.Image()，img.src=url，onload/onerror
// 2) computeScaledSize(naturalWidth, naturalHeight, maxEdge)
// 3) 未超限制 → resolve(img)；超限 → document.createElement('canvas') 等比绘制，resolve(canvas)
// 4) ctx 为 null 或异常 → 兜底 resolve(img)（不阻断）；onerror → reject

export function textureFromSource(source: HTMLImageElement | HTMLCanvasElement): THREE.Texture
// Canvas → new THREE.CanvasTexture(source)；Image → new THREE.Texture(source)
// 均设 needsUpdate=true，return
// 注：质量项（colorSpace/minFilter/mipmap/anisotropy）统一在 PhotoNode.applyTexture 中设置，这里不做
```

`defaultImageDeps()` 使用 `globalThis.Image` / `globalThis.document`（仅浏览器调用到，node 测试用注入假实现）。

### 2.3 `src/three/utils/MathUtils.ts`（扩展）

新增纯函数：

```ts
export function easeOutBack(t: number): number
// 1 + c3 * (t-1)^3 + c1 * (t-1)^2,  c1=1.70158, c3=c1+1
```

---

## 3. 既有模块修改

### 3.1 `src/three/photos/PhotoNode.ts`

**新增类型与构造选项**：

```ts
export type TextureLoaderFn = (src: string) => THREE.Texture | Promise<THREE.Texture>;

export interface PhotoNodeOptions {
  textureLoader?: TextureLoaderFn;         // 缺省 = new THREE.TextureLoader().load(...)（与现有行为一致）
  onReady?: (node: PhotoNode) => void;     // 纹理成功或失败兜底后回调（触发绽放）
  reducedMotion?: boolean;                 // true → 跳过绽放动画，立即 scale=1
}
```

**纹理加载重构**：
- `loadTexture(src, material)`：调用 `this.textureLoader(src)`。
  - 同步返回 → `applyTexture(texture, material)` 或失败兜底；
  - Promise → `.then(t => applyTexture(t, material), () => setPlaceholder(material))`。
- `applyTexture(texture, material)`：集中设置质量项（`colorSpace=SRGBColorSpace`、`minFilter=LinearMipmapLinearFilter`、`generateMipmaps=true`、`anisotropy=4`）、`material.map=texture`、`material.needsUpdate=true`，最后 `fireReady()`。
- `setPlaceholder(material)`：现有 `PLACEHOLDER_COLOR` 兜底逻辑，最后 `fireReady()`。
- `fireReady()`：`if (!this.readyFired) { this.readyFired = true; this.beginIntro(); this.options.onReady?.(this); }`

**绽放动画（D010 补齐）**：
- 常量：`INTRO_DURATION = 0.8`、`INTRO_MAX_DELAY = 0.35`。
- 构造时 `this.mesh.scale.setScalar(0)`（未就绪前隐藏）。
- `beginIntro()`（幂等）：`reducedMotion` → `scale.setScalar(1)` 并标记 bloomed；否则 `intro.active=true`。
- `update(deltaTime, elapsedTime)`：若 `intro.active && !intro.bloomed`：
  - `startedAt` 未记录则记录 `elapsedTime`；
  - `t = (elapsedTime - startedAt - intro.delay) / INTRO_DURATION`，`intro.delay = randomInRange(0, INTRO_MAX_DELAY)`（构造时确定）；
  - `t <= 0` → `scale.setScalar(0)`；`0 < t < 1` → `scale.setScalar(easeOutBack(t))`；`t >= 1` → `scale.setScalar(1)`，`bloomed=true`。
  - 漂浮（baseY/rotation.z）逻辑与本轮无关，保持现状，绽放期间照常执行。
- `forceReady()`：`if (!intro.active && !bloomed) beginIntro()`（供 main.ts 超时兜底）。
- `dispose()`：`mesh.geometry.dispose(); mesh.material.dispose();` 若 `material.map` then `material.map.dispose()`（低优先，勿破坏现有测试）。

> 兼容性：默认 loader 同步返回 → 构造即 `fireReady()` → `intro.active=true`，所以现有 node 测试仍然可测绽放。现有 photoManager.test.ts 断言语义不受影响（scale 不参与断言）。

### 3.2 `src/three/photos/PhotoManager.ts`

构造函数签名：

```ts
constructor(scene, moments, layoutConfig, options: {
  textureLoader?: TextureLoaderFn;
  onReady?: (node: PhotoNode) => void;
  reducedMotion?: boolean;
} = {})
```

`new PhotoNode(moment, layout[i], options)`。README 契约（`nodes.length === moments.length`）不变。

### 3.3 `src/three/core/Renderer.ts`

- `WebGLRendererLike` 增加可选 `setPixelRatio?(ratio: number): void;`
- 构造函数第 3 参：`pixelRatio?: number`，存为私有。
- `resize()`：若定义了 `pixelRatio` 且底层 renderer 有 `setPixelRatio`，先调用它再 `setSize`（`setSize` 自动乘 pixelRatio）。
- `mount` 首帧 resize 即生效 → DPR 变化/跨屏也会在 resize 时同步。
- 现有测试零破坏（fake 无 `setPixelRatio`，走可选分支）。

**使用方（main.ts）**：`new Renderer(camera, gl, tier.pixelRatioCap)`，其中 `gl = new THREE.WebGLRenderer({ antialias: tier.antialias, powerPreference: 'high-performance' })`。

### 3.4 `src/three/core/SceneManager.ts`

`addParticles(count: number = DEFAULT_PARTICLE_COUNT)`，把固定常量换成参数（保持缺省默认值，现有测试不受影响）。

### 3.5 `src/three/interaction/FocusController.ts`

构造函数第 2 参 `reducedMotion = false`：`this.focusDuration = reducedMotion ? 0.25 : FOCUS_DURATION`；`update` 中用 `this.focusDuration`。其余不变。

---

## 4. `src/three/main.ts` 重写要点

在 `initUniverse(container, options)` 内（不在模块顶层，避免导入副作用）：

1. **tier**：
```ts
const tier = resolveTier({
  dpr: window.devicePixelRatio || 1,
  width: document.documentElement.clientWidth || window.innerWidth,
  coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
});
```
2. **空守卫**：`if (moments.length === 0) return;`（空态卡由 Astro 端渲染）。
3. **renderer**：`gl.setPixelRatio` 交由 Renderer 构造参数；`renderer.domElement.setAttribute('role','img')` + `aria-label`（"和音滇韵实践团照片宇宙…"）。
4. **粒子**：`sceneManager.addParticles(tier.particleCount)`。
5. **加载追踪**：
```ts
const total = moments.length;
let readyCount = 0;
const hideLoading = () => loadingElement?.classList.add('is-hidden');
const onNodeReady = () => { readyCount += 1; if (readyCount >= total) hideLoading(); };
```
6. **降采样 loader**：
```ts
const loader: TextureLoaderFn = (src) => loadScaledImage(src, tier.maxTextureEdge).then(textureFromSource);
```
`PhotoManager(..., { textureLoader: loader, onReady: onNodeReady, reducedMotion: tier.reducedMotion })`。
7. **超时兜底**：`window.setTimeout(() => { hideLoading(); photoManager.nodes.forEach(n => n.forceReady()); }, 4000)`。
8. **触屏提示**：`hintElement.textContent = tier.isTouch ? '拖动旋转 · 双指缩放 · 点击查看' : '拖动旋转 · 滚轮缩放 · 点击查看'`。
9. **reducedMotion**：循环内 `if (!tier.reducedMotion) Particles.update(particles, delta);`；`Controls.update()` 逻辑不变；`new FocusController(cameraManager, tier.reducedMotion)`。
10. **Escape**：`window.addEventListener('keydown', e => { if (e.key === 'Escape' && 状态 === VIEWING) focusController.returnToExplore(); })`。
11. 其余（引导 2s、raycaster、状态回调、返回按钮、AnimationLoop）**保持不变**。
12. `UniverseOptions` 增加 `loadingElement?: HTMLElement | null`。

> `loadScaledImage` 的 reject 已在 PhotoNode 内部兜底（placeholder + fireReady），main.ts 无需 try/catch。

---

## 5. `src/pages/moments.astro` 修改

1. frontmatter：`import { moments } from '../data/moments';`，拿到 `moments.length`。
2. **空态**：`{moments.length === 0 && <div class="empty-state">…(`这里还没有照片` + `<a href={import.meta.env.BASE_URL}>返回首页</a>`)…</div>}`。
3. **加载指示**：在 caption 区块旁加 `<p id="loading" class="loading is-hidden">正在点亮记忆…</p>`（默认初次渲染先隐藏，由 main.ts 在就绪前揭示——注意与现有 `is-hidden` 机制一致，main.ts 用 classList 控制）。**实现时开一个 `console.log` 或由 main.ts 立即 `classList.remove('is-hidden')` 保证首帧可见，再按需隐藏。**
4. `<script>`：`initUniverse(container, { guideElement, captionElement, hintElement, backButton, loadingElement })`。
5. **CSS**：
   - `.loading`：右下角小字、暖色（`rgba(255,233,205,.7)`）、`transition: opacity .35s`、`.is-hidden{opacity:0}`。
   - ≤600px：`.back-btn` 移到**右上角**（避免与左下 caption 重叠）；`.caption` / `.back-btn` / `.hint` 加 `padding-bottom: env(safe-area-inset-bottom)`（iPhone 刘海），`padding-top` 同理安全侧（用 `env(safe-area-inset-top)` on back-btn）。
   - `.empty-state`：居中暖色卡，`z-index:50`，含标题+回首页链接。
   - `prefers-reduced-motion: reduce` 已全局兜 CSS transition；`.loading` 也纳入该媒体查询。

---

## 6. `content/posts/8.8.md` 修正

`tittle:` → `title:`（保持其余字段与引号不变）。

---

## 7. 测试计划

新增：
- `tests/device-tier.test.ts`：
  - 桌面宽 1280、非 coarse → `isMobile=false, pixelRatioCap=2, maxTextureEdge=2048, particleCount=400, antialias=true`
  - 移动 375、coarse → `isMobile=true, pixelRatioCap=1.75, maxTextureEdge=1024, particleCount=120, antialias=false`
  - 窄窗口但非 coarse（桌面小窗）→ `isMobile=false`
  - `reducedMotion` 透传
- `tests/scaled-texture.test.ts`：
  - `computeScaledSize`：≤maxEdge 原样不缩小；大图等比到长边=maxEdge；极小输入下限 1px
  - `loadScaledImage`：注入假 Image/假 canvas —— 大图→canvas 且 drawImage 被调用、尺寸正确；小图→原 img；getContext 返回 null → 兜底 resolve img
- `tests/photoManager.test.ts` 扩展（同一文件已有 mock）：
  - 默认 loader：`new PhotoNode({id:'x',src:'images/x.jpg'},{0,0,0})` → 初始 `scale≈0`；`update` 多帧后 `t≥INTRO_DURATION+delay` → `scale=1`
  - `reducedMotion` 节点：构造后 `scale=1`，update 不变
  - `forceReady()` 幂等
- `tests/renderer.test.ts` 扩展：fake 带 `setPixelRatio`，`new Renderer(camera, fake, 2).resize(...)` → 记录到 `[2]`；不传 pixelRatio 时不调用。

**验证命令**：
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass   # 若失败先执行
npm test          # 期望：全部通过（现有 50 + 新增）
npm run build     # 期望：dist 生成，/moments 无错误；验证 dist/moments/index.html 含 loading/empty 相关标记
```

---

## 8. 人工验收（webapp-testing 技能）

Playwright 打开 `http://localhost:4321/DianRhyme/moments/`（先 `npm run dev`）：

1. **桌面 1280×800**：截图——引导 2s 淡出；照片陆续「绽放」（多张截图时间序列）；页面无报错（console/errors 置空）。
2. **点击一张照片**：镜头平滑聚焦 → caption 卡显示标题/日期/地点 → 返回按钮可见。
3. **Escape**：VIEWING 态下按下 Esc → 回到探索态。
4. **移动视口 390×844**：截图——caption 左下、back-btn 右上不重叠；触屏提示文案为「双指缩放」；性能 OK（粒子降级生效——可凭代码核对 tier）。
5. **`prefers-reduced-motion: reduce`**（ emulateMedia）：照片立即显示（无绽放动画）、粒子静止。
6. 空态：临时改 `moments.ts` 为空数组（**验证后还原**）→ 显示空态卡；或仅凭代码走查。

---

## 9. 风险与回滚

| 风险 | 缓解 |
|---|---|
| node 测试环境踩到 Image/canvas | 新代码全部注入依赖；默认 loader 路径不动 |
| 默认 loader 同步化导致现有测试行为漂移 | 仅新增 `scale` 状态，原断言不含 scale；跑全量测试确认 |
| 高 DPR 下 `setPixelRatio` 与 `setSize` 顺序 | Renderer 先 setPixelRatio 再 setSize 固定顺序 |
| 移动端 1024 图在聚焦高清查看偏糊 | 属可接受（移动端权衡）；桌面才 2048 |
| 引导/加载指示时序错乱 | 展开检查视角：`onNodeReady`/`hideLoading` 定义顺序前置；超时兜底 4s 保底 |
| 改得出问题 | git 回退；全程单步提交（用户要求提交时才提交） |

---

## 10. 实现与验收记录（2026-08-13）

### 自动验证
- `npm test`：13 文件 / **70 用例全绿**（现有 50 + 新增 20）
- `npm run build`：dist 生成无错，`dist/moments/index.html` 含 loading/empty-state 标记

### Playwright 人工验收（headless Chrome，dev server）
- 桌面 1280×800：canvas 为 2560×1600（DPR=2 → pixelRatio 封顶生效，**高 DPI 清晰修复确认**）；照片渲染；点击聚焦成功，caption 正确（如"落地澜沧 · 2026.07.26 · 澜沧拉祜族自治县"）；空白点击返回、Escape 返回均通过；无 404
- 移动 390×844（is_mobile + dpr2）：触屏提示文案为"拖动旋转 · 双指缩放 · 点击查看"；触摸照片聚焦成功；`back-btn` 右上（y=12）、caption 左下（y≈689）**无重叠**；无报错
- `prefers-reduced-motion: reduce`：照片正常渲染、聚焦可用、无报错
- 桌面 console 残留 1 条 favicon 404 报错（全站既有，非本次改动引入）

### 过程中修订的决策
- **同步就绪不绽放**：`PhotoNode` 默认 loader（同步）直接 `scale=1` 显示，仅异步 loader（真实页面由 main.ts 注入）走"就绪即绽放"。原因：保住 node 测试环境（`TextureLoader` mock 同步返回）与 `raycaster.test.ts`（scale=0 平面无法被射线命中）。真实页面始终传异步降采样 loader，绽放效果完整。