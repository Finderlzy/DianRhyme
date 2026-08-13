# 开发记录

## v3.5 — 优化"精彩瞬间"页面的卡顿

**日期**：2026-08-13

### 变更内容

针对"精彩瞬间"页（Three.js 照片宇宙）的卡顿问题，分三块落地性能优化，整体视觉不变：

**① 方案 1（防御性修复 + 像素比修正）：**

1. **像素比修正**（`Renderer.ts`）：实际渲染像素比从"无条件 cap"改为 `min(devicePixelRatio, cap)`。DPR=1 屏幕（如 Windows 1080p）原被强制渲染到 2×（4 倍像素量）再降采样，纯为抗锯齿浪费填充率——桌面卡顿最大单一来源
2. **delta 钳制**（`AnimationLoop.ts`）：引入 `MAX_DELTA = 0.05`，自持 `elapsed` 累加器；切标签页 / GC 停顿 / DevTools 打断后的超大 delta 不再造成动画跳变
3. **标签页隐藏暂停**（`AnimationLoop.ts`）：监听 `visibilitychange`，隐藏→停循环、可见→恢复且首帧 delta≈0（`start()` 丢弃 clock 陈旧累积）；监听常驻只绑定一次，恢复时浮动/粒子相位连续
4. **测试补齐**：`tests/renderer.test.ts` 新增 DPR 低于/高于 cap 两边界用例；`tests/animation-loop.test.ts` 新增大 delta 钳制、hidden 暂停 / visible 恢复不双循环用例

**② 方案 2（粒子动画 GPU 着色器化）：**

5. **粒子 GPU 化**（`Particles.ts`）：`PointsMaterial` → `ShaderMaterial`，位置漂移（±0.5 / 0.4 / 0.5）移入 vertex shader，相位由 position 伪随机哈希生成；`gl_PointSize` 公式与原 `sizeAttenuation` 数学等价；删除逐粒子 CPU 循环与整块 buffer `needsUpdate` 重传，每帧固定开销近乎归零
6. **viewport 同步**（`main.ts`）：渲染循环内 `Particles.syncViewport(particles, gl.domElement.height)`，点尺寸自动跟随 resize 与 DPR
7. **粒子消失 bug 修复**（D030）：three ShaderMaterial 前缀已自动声明 `attribute vec3 position;`，初版重复声明致 GLSL 编译失败、粒子全部不渲染；删除重复声明 + 新增回归测试断言

**③ 加载/绽放窗口期去卡顿（D028 / D031）：**

页面加载时照片逐一 bloom 浮现阶段非常卡（引导文字阶段不卡）。根因：moments 页 35 张图中约 20 张边长 >2000px（多张 8192×4608 / 8064×6048 / 6000×3376、单张 10-13MB）；旧路径主线程 `drawImage` 同步降采样每张数十 ms，且 bloom 与纹理就绪强耦合——每张照片浮现那帧恰好撞上重降采样 + 纹理上传 + mipmap 生成。

8. **降采样移出主线程**（`LoadScaledTexture.ts`）：新增 `loadImageBitmap`，`fetch → blob → createImageBitmap(blob, { resizeWidth/Height, resizeQuality:'high' })`，解码+缩放全在浏览器 worker 完成，主线程不再做 `ctx.drawImage`；超大图先解码取尺寸、再二次离屏缩放；原 canvas 路径（`loadScaledImage`）保留为兜底（`createImageBitmap`/`fetch` 不可用或失败时回退）
9. **纹理上限收紧**（`DeviceTier.ts`）：桌面 `maxTextureEdge` 2048→**1024**、移动 1024→**768**，上传/mipmap/显存降为 ~1/4
10. **加载并发限流**（`LoadScaledTexture.ts` 的 `createPacedTextureLoader` + `main.ts`）：并发上限 6 张的异步队列，消除大图集中突发，照片更均匀地逐一浮现
11. **照片颠倒回归修复**（D032）：离屏路径引入照片上下颠倒——three 对 `ImageBitmap` 来源不应用 `UNPACK_FLIP_Y_WEBGL`（`WebGLTextures.js` isImageBitmap 分支），须用 `imageOrientation:'flipY'` 预翻转。`loadImageBitmap` 最终返回的 bitmap 一律预翻转（大图在缩放步、小图多一次 flip 调用），首步解码保留 `from-image` 应用 EXIF 方向

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/three/core/Renderer.ts` | 构造新增可注入 `pixelRatioSource`（默认读 `window.devicePixelRatio || 1`，node 返回 1）；`resize` 改 `min(dpr, cap)` |
| `src/three/core/AnimationLoop.ts` | `MAX_DELTA` 钳制、自持 `elapsed`、`visibilitychange` 暂停/恢复 |
| `src/three/effects/Particles.ts` | 重写：ShaderMaterial + GPU 漂移 + `syncViewport`；修复 position 重复声明 |
| `src/three/main.ts` | 渲染循环新增 `Particles.syncViewport(...)`；纹理加载改用 `createPacedTextureLoader({ maxEdge, concurrency: 6 })` |
| `src/three/utils/DeviceTier.ts` | `maxTextureEdge` 2048→1024 / 1024→768 |
| `src/three/utils/LoadScaledTexture.ts` | 新增 `loadImageBitmap`（离屏解码缩放 + `imageOrientation:'flipY'` 预翻转）、`createPacedTextureLoader`（并发队列）、`TextureSource`；`textureFromSource` 支持 `ImageBitmap` |
| `tests/renderer.test.ts` | 更新既有像素比用例 + 新增 DPR 封顶/低值边界 |
| `tests/animation-loop.test.ts` | 新增 delta 钳制与可见性暂停/恢复用例 |
| `tests/particles.test.ts` | 重写：材质/uniform/着色器断言 + position 不重复声明回归用例 |
| `tests/scaled-texture.test.ts` | 新增 loadImageBitmap 3 例（含 flipY）+ 并发队列 2 例（限流、顺序） |
| `tests/device-tier.test.ts` | 纹理上限断言更新 |

### 验收

- **结论**：全量 `npm test` → 13 文件 / **85 tests** 全部通过；`npm run build` 通过（three.js chunk 约 553 kB / gzip 142 kB 的 `>500kB` 警告为已知预期，见 AGENTS.md）
- **人工反馈**：拖动旋转流畅；粒子经 bug 修复后恢复可见且尺寸与原版一致；照片方向恢复正常；绽放阶段卡顿显著缓解
- **待复验**：线上部署后最终确认绽放阶段不掉帧

### 提交记录

| Commit | 说明 |
|---|---|
| 暂未提交 | 用户决定不执行 git（同验收记录约定） |

---

## v2.2 — 实践过程记录改造为推文时间线

**日期**：2026-08-06

### 变更内容

将"实践过程记录"页从"逐日日记全文"改版为"推文时间线"：下线日记全文展示，上线推文卡片时间线，并完成真实内容录入。

1. **下线日记全文展示**：删除 `content/diaries/` 数据源与 `DiaryTimeline` 组件，页面不再展示日记全文
2. **上线推文时间线**：新增 `content/posts/` 数据源（每篇一个 `.md`，frontmatter 字段 `date/title/cover/excerpt/url`）与 `PostTimeline` 推文卡片组件；`diary.astro` 通过 `import.meta.glob` 读取并按 `date` 升序排序传入组件；卡片含封面（缺省渐变 🎵 占位）、日期、标题、两行摘要，整卡外链微信公众号原文（`target="_blank" rel="noopener noreferrer"`）
3. **真实内容录入**：录入 10 篇真实推文（7.10–8.4），封面图入库 `public/images/posts/`
4. **文档同步**：README、使用指南更新为推文操作指南，消除"改版中" / "日记"过时描述

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/pages/diary.astro` | 重写：移除 `content/diaries` 读取与 `DiaryTimeline` 引用，改为 `import.meta.glob('../../content/posts/*.md')` 升序读取传入组件 |
| `src/components/PostTimeline.astro` | 新增：推文卡片时间线组件 |
| `src/components/DiaryTimeline.astro` | 删除 |
| `content/posts/*.md` | 新增：10 篇真实推文 |
| `content/diaries/` | 删除 |
| `public/images/posts/` | 新增：10 张推文封面 |
| `README.md` / `使用指南.md` / `AGENTS.md` | 文档同步为推文定位 |
| `docs/验收报告-post-timeline-phase0~3.md` | 验收报告（Phase 0 清理 / 1 数据结构 / 2 示例验证 / 3 真实录入） |

### 提交记录

| Commit | 说明 |
|---|---|
| 本次提交 | v2.1 推文时间线改版（含 Phase 0–3 全部变更） |

---

## v2.0 — 完整发版（v1.4 + v1.5 + 文档体系重构）

**日期**：2026-07-31

### 变更内容

聚合 v1.4、v1.5 及发版前的全部未提交改动，作为 v2.0 统一发版：

1. **队徽徽章化**（v1.4）：NavBar / Hero / Footer 三处圆形徽章，队徽 `logo.jpg`
2. **团队卡片行居中**（v1.5）：首页三行卡片（2/2/5 人）居中 + `overflow-x` 横向溢出修复
3. **文案统一**（v1.5）：实践时间 14 天、团队全称"酉良和音滇韵民族团结实践团"
4. **README 重构**：改为面向编辑者的入口文档——"改内容 3 件事"表格（日记 / 画廊 / 首页）+ 发布流程，标注 `overview.md`、`team.md` 不被页面读取
5. **使用指南修正**：1.3 改为编辑 `index.astro`（原指引的 `overview.md` 不生效）、1.4 更新为 `teamRows` 真实结构、人数统一 9 名、本地视频缩略图限制说明、行号同步
6. **AGENTS.md 更新**：环境要求（Node ≥ 20）、画廊视频条目缺陷说明
7. **.gitignore**：忽略 `待解决问题.md`（个人草稿）、`desktop.ini`
8. **版本号**：`package.json` 1.0.0 → 2.0.0，git tag `v2.0`

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/pages/index.astro` / `src/components/Footer.astro` / `src/components/NavBar.astro` / `src/layouts/BaseLayout.astro` / `src/styles/global.css` | v1.4 徽章 + v1.5 行居中与文案 |
| `src/pages/diary.astro` | 导语"十四天" |
| `README.md` / `使用指南.md` / `AGENTS.md` | 文档体系重构 |
| `.gitignore` / `package.json` | 忽略项、版本号 |
| `docs/验收报告-v1.4.md` / `docs/验收报告-v1.5.md` | 验收报告 |

### 提交记录

| Commit | 说明 |
|---|---|
| 本次提交 | v2.0 完整发版（tag `v2.0`） |

---

## v1.5 — 团队卡片行居中 + 文案更新

**日期**：2026-07-31

### 变更内容

1. **团队卡片行居中**：首页"团队成员"三行卡片（2/2/5 人）由靠左对齐改为每行整体水平居中（`.team-row` 加 `justify-content: center`），悬停展开时行对称重新居中
2. **横向溢出修复**：`.team` 加 `overflow-x: hidden`，消除 5 人行悬停展开（总宽约 1160px > 容器 1052px）在窄屏下引发的页面横向滚动条
3. **实践时间统一 14 天**：日期区间改为 7 月 26 日 — 8 月 8 日，同步 hero 副标题"十四个日夜"、about"为期 14 天""14 天很短"、日记页"十四天"
4. **团队全称统一**：正式名称统一为"酉良和音滇韵民族团结实践团"（hero 小字、Footer、meta description、团队卡片、about 正文）；郭辉 bio 的"2025年酉良实践团团长"历史表述保留
5. **文档同步**：README、使用指南、overview、需求文档、开发总结 等同步更新
6. **顺带修正**：`.team-row` 中 `display: flex` 的错误缩进

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/pages/index.astro` | 行居中 CSS + 文案更新 |
| `src/pages/diary.astro` | 导语"十四天" |
| `src/components/Footer.astro` | Footer 全称 |
| `src/layouts/BaseLayout.astro` | meta description 全称 |
| `README.md` / `content/overview.md` / `需求文档.md` / `开发总结.md` / `使用指南.md` | 文案同步 |
| `docs/验收报告-v1.5.md` | 验收报告 |

### 验收

- **结论**：通过（详情见 `docs/验收报告-v1.5.md`）
- **已知说明**：悬停对称展开、无横向滚动条为交互视觉行为，已通过构建产物 CSS 规则代码级验证，最终视觉确认以浏览器为准

### 提交记录

| Commit | 说明 |
|---|---|
| 暂未提交 | 待用户确认后统一提交 |

---

## v1.4 — 首页队徽（Logo）徽章化

**日期**：2026-07-31

### 变更内容

为首页队徽"和音滇韵"添加圆形徽章容器（`.logo-badge`），解决 JPG 背景与页面背景色不一致的问题：

1. **徽章容器**：用 `border-radius: 50%; overflow: hidden; background-color: var(--color-bg-white)` 将队徽裁剪为圆形，隐藏原始 JPG 边缘背景色
2. **三处应用**：NavBar 文字右侧、Hero 大标题旁、Footer 文字右侧
3. **尺寸适配**：Nav/Footer 30×30px，Hero 64×64px，均与周围文字成比例
4. **间距收紧**：NavBar/Footer 间距从 8px 缩至 6px；Hero 间距从 16px 缩至 10px，标题下边距从 24px 缩至 16px
5. **旧 CSS 清理**：移除已废弃的 `.logo-img`、`.hero-logo`、`.footer-logo-img` 规则
6. **AGENTS.md 更新**：新增 Logo 存放规范与徽章尺寸说明

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/styles/global.css` | 新增 `.logo-badge` 基础样式 |
| `src/components/NavBar.astro` | logo 包裹 `<span class="logo-badge">`，尺寸 30×30px |
| `src/pages/index.astro` | Hero 区 logo 包裹 `<span class="logo-badge">`，尺寸 64×64px |
| `src/components/Footer.astro` | footer logo 包裹 `<span class="logo-badge">`，尺寸 30×30px |
| `docs/验收报告-v1.4.md` | 验收报告 |

### 验收

- **结论**：通过（详情见 `docs/验收报告-v1.4.md`）
- **已知说明**：队徽 JPG 文件 `public/images/logo.jpg` 需由用户提供；当前构建产物中 `logo.jpg` 尚未存在，部署前需放入文件

### 提交记录

| Commit | 说明 |
|---|---|
| 本次提交 | 队徽徽章化：Navbar + Hero + Footer，三处圆形徽章，间距与尺寸调整 |

---

## v1.3 — 团队成员真人照片

**日期**：2026-07-31

### 变更内容

为首页团队成员卡片（`TeamCard`）添加真人照片：

1. **折叠态不变**：仍显示彩色圆圈 + 姓名缩写 + 职务
2. **展开态**：中部照片占位改为 96×120 竖长圆角真人照片（`border-radius: 10px`，`object-fit: cover`，竖幅裁剪避免切掉头发）
3. **高度适配**：展开高度 120px → 140px，照片槽位 max-width 56px → 110px
4. **占位升级**：无照片成员显示 96×120 竖长圆角渐变占位，字号同步放大
5. **9 人照片绑定**：`index.astro` 中 9 位成员 `avatar` 字段填入 `/DianRhyme/images/avatars/<拼音>.jpg`

### 涉及文件

| 文件 | 变更 |
|---|---|
| `public/images/avatars/*.jpg` | 新增 9 张成员照片（lizhaoyan 后替换为竖版 1280×1707） |
| `src/pages/index.astro` | 9 处 `avatar` 路径填充 |
| `src/components/TeamCard.astro` | 照片尺寸/形状、展开高度、占位样式 |
| `使用指南.md` | 1.6 节头像说明更新 |
| `docs/验收报告-v1.3.md` | 验收报告 |

### 验收

- **结论**：通过（详情见 `docs/验收报告-v1.3.md`）
- **已知说明**：`leizichen.jpg` 为横版（1534×1024），`cover` 裁切会切上下，经确认无需修改；`public/images/avatars/resources/` 为未跟踪临时文件，建议推送前清理

### 提交记录

| Commit | 说明 |
|---|---|
| `aa68670` | 设计文档：团队成员真人照片 spec |
| `3c7d751` | 照片样式 + 9 人 avatar 绑定 |
| 本次提交 | 照片尺寸调整为 96×120 竖长、验收报告、changelog v1.3 完善 |

---

## v1.2 — 团队介绍 UI 改造

**日期**：2026-07-31

### 变更内容

修改首页团队成员卡片（`TeamCard`）的布局与交互：

1. **默认状态布局**：头像居中在上，姓名在圆圈内，职务在姓名下方，整体垂直居中排列
2. **展开状态**：悬停时向右展开，左侧信息不变，右侧出现照片占位（渐变背景 + 姓名缩写）和 bio 文字
3. **固定高度**：收起 100px / 展开 120px，避免边框遮挡内容
4. **统一展开方向**：所有三行统一使用 `right` 展开，移除 `overlay` 变体
5. **视觉优化**：照片占位使用渐变背景，悬停阴影加深

### 涉及文件

| 文件 | 变更 |
|---|---|
| `src/components/TeamCard.astro` | 主组件重构 |
| `src/pages/index.astro` | 第三行 expandDirection 改为 `right` |
| `docs/superpowers/specs/2026-07-31-team-card-design.md` | 设计文档 |

### 提交记录

| Commit | 说明 |
|---|---|
| `bd1d808` | 初始重构：布局、占位、阴影、移除 overlay |
| `ac976b4` | 高度调整：72px/120px，圆圈 48px，间距调整 |
| `f0ac557` | 收起高度增至 100px |
| `4b7147a` | 最终确认：spec 文档同步更新 |

---

## v1.1 — 初始版本

**日期**：2026-07（首次提交）

### 变更内容

项目初始化，搭建 Astro 静态站点骨架：

1. 首页（index）：Hero 区域、实践概况、团队成员卡片
2. 实践日记页（diary）：Markdown 时间轴
3. 图片视频页（gallery）：时间线画廊 + Lightbox 灯箱
4. 基础布局、导航栏、页脚、全局样式

### 涉及文件

- Astro 4.16 项目骨架
- `src/pages/index.astro`、`diary.astro`、`gallery.astro`
- `src/components/`：NavBar、Footer、InfoCard、TeamCard、DiaryTimeline、GalleryTimeline、Lightbox
- `src/styles/global.css`：全局样式与 CSS 变量
- `content/diaries/`：日记 Markdown 文件
- `public/images/`：占位图片

---

## 版本历史

| 版本 | 日期 | 说明 |
|---|---|---|
| v2.0 | 2026-07-31 | 完整发版：队徽徽章化 + 行居中 + 文案统一 + README/使用指南重构 |
| v1.5 | 2026-07-31 | 团队卡片行居中 + 文案更新（14 天 / 全称） |
| v1.4 | 2026-07-31 | 首页队徽（Logo）徽章化 |
| v1.3 | 2026-07-31 | 团队成员真人照片 |
| v1.2 | 2026-07-31 | 团队介绍 UI 改造 |
| v1.1 | 2026-07 | 项目初始化