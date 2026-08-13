# 和音滇韵整体改版（编辑部质感）— Agent 执行计划

**日期**：2026-08-14
**状态**：✅ 已完成并通过构建 + 测试 + Playwright 验收

## 目标

在不动框架/依赖/内容/`moments` 3D 的前提下，将暖色站升级为单一琥珀强调色 + 左对齐编辑式排版 + 无边框信息栏 + 完整 a11y/元信息，消除全部已诊断的通用感问题。

**已确认方向**：单一琥珀橙为主 · 区块标题左对齐+短规则线+眉题 · 信息卡改无边框编辑式信息栏 · 不新增字体（仅精修排版特征）。

**改动范围**：`global.css`、`BaseLayout.astro`、`NavBar.astro`、`Footer.astro`、`index.astro`、`diary.astro`、`PostTimeline.astro`、新增 `src/pages/404.astro`。**不动**：`moments` 3D、`content/*`、`src/data/*`、`src/three/*`、依赖、文档。

---

## Phase 1 — `src/styles/global.css`

1. 色板统一（去绿）：
   - `--color-accent: #7BA587` → `#A98454`（柔和琥珀）
   - `--color-accent-light: #A8C9B0` → `#D8C09A`（暖沙）
   - `a:hover` 颜色 `var(--color-accent)` → `var(--color-primary)`
2. 排版特征：h1–h6 加 `text-wrap: balance`；`.section-title` 加 `letter-spacing: -0.01em`；新增 `.tabular-nums` 工具类；`.section` padding `80px 0` → `72px 0 96px`；段落 `text-wrap: pretty`。
3. 表面质感：`body::before` 全局细噪点（fixed inset 0，`z-index: 2`，pointer-events none，SVG noise data-URI ~3%）；body 背景改「径向暖光 + 米白」。
4. 交互状态：全局 `:focus-visible`（a/button）；`button:active`/`a:active` `scale(0.98)`。
5. `.section-title` 编辑式左对齐（`text-align:left` + `::before` 琥珀规则线）；新增 `.section-kicker` 眉题样式。

## Phase 2 — `src/layouts/BaseLayout.astro`

- favicon → `BASE_URL + 'images/logo.jpg'`（修复验收时发现的 404）
- OG/Twitter 元信息（`og:type/title/description/image`、`twitter:card`，`og:image` 用绝对地址）
- 跳转链接 `跳到主要内容` + `<main id="main">` + `.skip-link` 样式

## Phase 3 — `src/components/NavBar.astro`

- 活动链接加 `aria-current="page"`

## Phase 4 — `src/components/Footer.astro`

- `.footer-info p { line-height: 8 }` → `1.75`（bug）
- GitHub 链接 → `https://github.com/Finderlzy/DianRhyme`

## Phase 5 — `src/pages/index.astro`

1. Hero：`100dvh`（带 `100vh` 回退）；眉题色 `var(--color-primary-dark)`；标题 `text-wrap:balance` + 柔和光晕；团队合影 `::after` 偏移琥珀外框。
2. 三处区块加 `.section-kicker`（概览/缘起/同行）。
3. 实践概况 → 无边框信息栏：`.info-grid` 改 flex wrap；`InfoCard` 去边框阴影，改 `border-left` 分隔（首项无），移动端左竖线堆叠；label 小号字距、value 衬线。
4. 关于：首段衬线大号引导段，其余 `text-wrap:pretty`。
5. Team：`colors` 数组全暖色系；`.card-name` `text-wrap:balance`。

## Phase 6 — `src/pages/diary.astro` + `src/components/PostTimeline.astro`

- diary：加 `.section-kicker`（过程）；`.diary-intro` 左对齐。
- PostTimeline：`.post-date` 衬线 + `tabular-nums` + `::before` 规则线（编辑式日期轨）；`.post-title` `text-wrap:balance`。

## Phase 7 — 新增 `src/pages/404.astro`

- 套 BaseLayout，暖色居中：大号衬线 404 + 音符 + 文案 + 「返回首页」/「实践过程记录」按钮，均用 `BASE_URL`。

## Phase 8 — 验证

- `npm run build`（检查 dist/404、meta/favicon 前缀）
- `npm run test`（70 用例仍绿）
- Playwright 抽查：首页（kicker/左对齐/信息栏/hero 外框/焦点环/skip-link）、diary（日期轨）、404 页、console 无 404/error

## 明确不做

- 不改 moments 3D、content/*、src/data/*、src/three/*、依赖、框架
- 不加字体/库/legal 链接
- 不改使用指南.md / AGENTS.md
- 不删除图片资源

## 风险与缓解

- `a:active` 覆盖卡片 hover translateY：以「不做多余动画冲突」为准，必要时仅保留 `button:active`
- 噪点过重可降至 2%，验收截图确认
- `.section-title` 左对齐同步影响 diary：预期行为

---

## 验收记录（2026-08-14）

- `npm run build`：4 页全部构建，`dist/404.html` 生成于根目录（GitHub Pages 自动托管未知路径）
- `npm run test`：13 文件 / 70 用例全绿（three 模块未动）
- Playwright（dev server，headless Chrome）：
  - 首页：`.section-kicker`（概览/缘起/同行）存在；`.section-title` 左对齐 + `::before` 琥珀规则线（28px）；`.info-card` 无边框无阴影（`borderTop 0 / boxShadow none / bg transparent / flexBasis 260px`）；hero 外框 `::after` 偏移 14px 生效；skip-link 默认隐藏、聚焦时定位到左上且有焦点环；Tab 焦点环正常
  - diary：kicker「过程」存在；`.post-date` 衬线 + `tabular-nums` + 琥珀规则线（18px）
  - 404：`/DianRhyme/nonexistent-page` 渲染 404 页，返回首页/实践过程记录链接前缀正确
  - console 无错误、无资源 404（favicon 404 已消除；仅对故意访问的不存在路径出现 dev server 404 回退日志）
- 截图像素产物：`C:\Users\ASUS\AppData\Local\Temp\opencode\redesign-verify\{home,diary,404}.png`
- 全站 `src/` 无残留绿/蓝/紫强调色（grep 确认）