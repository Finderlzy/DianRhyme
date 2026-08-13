# AGENTS.md

## 速查

- **开发服务器**：`npm run dev` → http://localhost:4321/DianRhyme/（需先 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`，PowerShell 默认阻止脚本）
- **构建**：`npm run build` → 输出到 `dist/`
- **预览**：`npm run preview` → 本地服务构建产物 `dist/`（http://localhost:4321/DianRhyme/），推送前检查线上效果用
- **测试**：`npm test`（vitest，`--passWithNoTests`，`tests/**/*.test.ts`，环境 node 无 DOM）；单文件：`npx vitest run tests/device-tier.test.ts`
- **部署**：推送到 `main` → GitHub Actions 自动部署到 Pages（CI 只跑 `npm run build`，**不跑测试**，测试门禁仅在本地）
- **无 lint、typecheck 命令**（`astro check` 未配置，tsconfig 用 `astro/tsconfigs/strict`）
- **框架**：Astro 4.x（手动搭建，非 `create-astro` 脚手架）+ Three.js（"精彩瞬间"页 3D 照片宇宙）
- **环境要求**：Node ≥ 20、npm ≥ 10（见 README；CI 固定 Node 20）
- **工作方式**：只执行用户明确要求的改动；不要自作主张新增或修改文件（如自动补 `docs/changelog.md` 记录、顺手清理代码等），除非用户要求

## 关键：子路径 base

站点部署到 `finderlzy.github.io/DianRhyme/`，base 路径 `/DianRhyme/` 在 `astro.config.mjs:6` 设置。所有 `.astro` 文件和 Markdown 中的资源引用必须加此前缀，不能写 `/images/...`。

- `.astro` / `src/data/moments.ts` 中：用 `import.meta.env.BASE_URL`（解析为 `/DianRhyme/`）
- `content/` 下的 Markdown 文件中：直接写 `/DianRhyme/images/...`
- 例外：`index.astro` 的 `teamRows` 头像路径硬编码为 `/DianRhyme/images/avatars/...`（未用 BASE_URL），若改 base 需一并处理

## 架构

- **CMS、无动态数据、无 API 调用** —— 纯静态站点
- **内容**：`content/` 下的 Markdown 文件，构建时通过 `import.meta.glob()` 读取
- **硬编码数据**：首页卡片和团队成员在 `src/pages/index.astro`（JS 数组 `infoItems`、`teamRows`）；"精彩瞬间"照片数据在 `src/data/moments.ts`（`moments` 数组，字段 `id/src/title/description/date/location`）
- **glob 路径**：相对于**调用该方法的文件**而非项目根目录解析（`diary.astro` 用 `import.meta.glob('../../content/posts/*.md')`）

### 内容文件

| 文件 | 控制内容 |
|------|---------|
| `content/posts/*.md` | 实践过程记录推文（增删 = 创建/删除 .md 文件） |
| `src/data/moments.ts` | "精彩瞬间"页照片宇宙的照片数据（增删 = 改 `moments` 数组） |

⚠️ `content/overview.md`、`content/team.md` **未被任何页面读取**。首页"关于这次实践"正文和团队数据全部硬编码在 `src/pages/index.astro`，改这两个 .md 文件不会影响页面。

推文 `.md` 文件**必须**包含 frontmatter 字段：`date`、`title`、`cover`、`excerpt`、`url`，缺失会导致构建失败。`date` 为发布日期（排序依据），不包含 `day` 字段，页面不显示"Day N"标签。`cover` 写 `/DianRhyme/images/...`。

## 精彩瞬间（Three.js 照片宇宙）

`src/pages/moments.astro` 挂载 `src/three/main.ts` 的 `initUniverse()`，照片以 3D 照片墙呈现，支持拖动旋转、滚轮缩放、点击聚焦查看说明卡。模块划分：

```
src/three/core/         — AnimationLoop、CameraManager、Renderer、SceneManager
src/three/effects/      — Atmosphere（暖光氛围）、Particles（粒子）
src/three/interaction/  — Controls、FocusController、Raycaster
src/three/photos/       — PhotoManager、PhotoNode、LayoutGenerator
src/three/utils/        — DeviceTier（设备分级）、LoadScaledTexture（图片降采样）、MathUtils
```

- 交互流程在 `main.ts`：进入（ENTERING）→ 探索（EXPLORING，可拖动/点击）→ 聚焦移动（FOCUSING，FocusController 独占摄像机）→ 查看（VIEWING，显示说明卡 + "返回探索"）→ Escape / 返回按钮退出
- 设备分级 `DeviceTier` 依据 DPR/屏幕宽度/触屏/`prefers-reduced-motion` 调整抗锯齿、粒子数、纹理分辨率；图片超限时 `LoadScaledTexture` 用 canvas 等比降采样后再进 GPU
- 修改 three 模块后建议跑 `npm test`（`tests/` 下对应单测，如 `device-tier.test.ts`、`photoManager.test.ts`）

## 添加媒体

1. 将文件放入 `public/images/`
2. `.astro` 文件中引用为 `base + 'images/filename.jpg'`
3. Markdown 文件中引用为 `/DianRhyme/images/filename.jpg`
4. 文件名区分大小写
5. "精彩瞬间"的照片同时要加进 `src/data/moments.ts` 的 `moments` 数组

## 项目结构

```
src/pages/        — 4 个页面文件（index、diary、moments、404）
src/layouts/      — BaseLayout.astro（导航 + 页脚布局）
src/components/   — NavBar、Footer、InfoCard、TeamCard、PostTimeline
src/data/         — moments.ts（精彩瞬间数据）
src/three/        — 精彩瞬间 Three.js 照片宇宙
src/styles/       — global.css（CSS 变量、暖色调主题）
tests/            — vitest 单元测试（tests/*.test.ts）
content/          — 可编辑 Markdown（posts/、overview.md、team.md 为遗留未读）
public/images/     — 图片资源（含推文封面 posts/、团队头像 avatars/）
public/videos/     — 遗留空目录，当前无视频支持
docs/superpowers/specs/ — 设计文档（按日期命名）
docs/changelog.md  — 开发记录
```

## 常见陷阱

- 忘记加 `/DianRhyme/` 前缀 → 部署后资源 404
- 推文 frontmatter 缺少字段 → 构建报错
- `import.meta.glob` 相对路径写错 → `AstroGlobNoMatch` 错误
- `npm run dev` 的地址是 `localhost:4321/DianRhyme/`（含 base），不是 `localhost:4321/`
- PowerShell 中直接 `npm run dev` 会因执行策略失败 → 先运行 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- `moments` 数组里 `src` 用 `import.meta.env.BASE_URL`（`src/data/moments.ts` 顶部已有 `const base`），不要写死 `/DianRhyme/` 之外的路径
- README 中"图片视频 / `gallery.astro` / `galleryGroups`"是过期信息——gallery 页已被"精彩瞬间"（`moments.astro`）取代，页面清单以 AGENTS.md 为准
- 根目录 `AGENT_CONTEXT.md` 是立项阶段的设计与 Decision Log，属历史记录，不是当前权威说明，勿据此改代码
- 构建时 three.js chunk 约 535KB 触发 `>500kB` 警告是已知预期现象，不影响部署
