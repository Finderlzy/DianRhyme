# 验收报告 — post-timeline Phase 1 数据结构与组件骨架

**验收日期**：2026-08-06
**验收对象**：① `content/posts/` 推文数据目录；② `PostTimeline` 推文卡片组件；③ `diary.astro` 数据读取与排序；④ 页面文案去"日记"化；⑤ 空态正常生成
**验收依据**：开发计划 Phase 1 要求（注：`docs/2026-08-06-post-timeline-plan.md` 不存在，按任务消息内嵌的 Phase 1 要求执行）
**验收方式**：静态构建产物检查（文件系统检查 + 产物 HTML 结构校验 + CSS 规则校验 + 临时样例推文验证链接属性）

---

## 验收环境

- Node.js / npm 构建环境，`npm run build` 产出 `dist/`
- 校验对象：`dist/diary/index.html`、`dist/_astro/*.css`、源码 `src/pages/diary.astro`、`src/components/PostTimeline.astro`、`content/posts/`

---

## 验收标准与结果

| # | 验收标准 | 验证方式 | 结果 | 证据 |
|---|----------|----------|------|------|
| 1 | `content/posts/` 目录存在 | 文件系统检查 | ✅ 通过 | `content/posts/` 已创建（含 `.gitkeep` 占位，保证空目录随 git 提交持久化） |
| 2 | `src/components/PostTimeline.astro` 存在 | 文件系统检查 | ✅ 通过 | 组件已创建，含 `post-card` / `post-cover` / `post-excerpt` / `post-more` 样式 |
| 3 | 空状态正常生成 | 产物检查 | ✅ 通过 | `dist/diary/index.html` 含 `暂无推文记录，敬请期待。` |
| 4 | dist 中无 "Day N" 标签 | grep | ✅ 通过 | `dist/diary/index.html` 无 `Day ` 匹配；frontmatter 无 `day` 字段 |
| 5 | 链接属性 `target="_blank"` `rel="noopener noreferrer"` | 临时样例验证 | ✅ 通过 | 样例构建产物含 `<a class="post-card" href="..." target="_blank" rel="noopener noreferrer">`（2 处） |
| 6 | 卡片包含封面/日期/标题/摘要/阅读全文 | 临时样例验证 | ✅ 通过 | 样例产物含封面 `<img>`、日期 `2026-07-27`、标题、摘要、`阅读全文 →` |
| 7 | cover 缺失有默认占位 | 临时样例验证 | ✅ 通过 | 无 cover 样例渲染 `post-cover-placeholder` + 🎵 图标 |
| 8 | 摘要最多两行省略 | CSS 校验 | ✅ 通过 | 构建 CSS 含 `.post-excerpt{...-webkit-line-clamp:2;...overflow:hidden}` |
| 9 | 按 date 升序排序 | 临时样例验证 | ✅ 通过 | 样例 `2026-07-27` 排于 `2026-07-29` 之前 |
| 10 | `npm run build` 执行成功 | 构建日志 | ✅ 通过 | `3 page(s) built in 544ms`，三次构建均通过 |

---

## 关键设计决策与理由

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据读取方式 | `import.meta.glob('../../content/posts/*.md', { eager: true })` | 与 Phase 0 清理前项目惯用方式一致；空目录返回 `{}`，不会抛 `AstroGlobNoMatch`，天然支持空态 |
| 日期处理 | 统一经 `new Date()` 归一化，输出 `YYYY-MM-DD` 展示字符串，另存 `dateValue` 时间戳做升序排序 | 规避 YAML 把 `date` 解析为 Date 对象导致展示异常；排序与展示分离，字段语义清晰 |
| 组件结构 | `PostTimeline.astro` 单一展示组件，Props 为 `PostEntry[]`，卡片为语义化 `<a>` | 整卡可点且可访问性好；与 `GalleryTimeline` 同类"数据在页面层、展示在组件层"的项目惯例一致 |
| 整卡可点 | 卡片整体包裹 `<a target="_blank" rel="noopener noreferrer">` | 点击任意区域跳转微信原文；`noopener` 防新页操纵、`noreferrer` 隐私保护 |
| cover 缺失处理 | 组件内 `post.cover ? <img> : 占位块（渐变 + 🎵）` | 数据未就绪时不破版；占位风格沿用项目渐变占位既有样式 |
| 摘要省略 | `-webkit-line-clamp: 2` + `overflow: hidden` | 固定两行省略，卡片高度整齐 |
| 空态归属 | 页面层（diary.astro）判断 `entries.length === 0` 渲染空态，组件层再兜底 `entries.length > 0` 才渲染 | 页面层管文案、组件层防御性跳过渲染，职责清晰 |
| `.gitkeep` 占位 | `content/posts/`、`public/images/posts/` 各加一个 | 空目录不会被 git 跟踪，占位文件保证目录随提交持久化 |

---

## 数据核对

| 项目 | 结果 |
|------|------|
| `content/posts/` 内容 | `.gitkeep`（无真实 .md，符合"可为空目录"） |
| `public/images/posts/` 内容 | `.gitkeep`（为未来封面预留） |
| frontmatter 字段 | `date` / `title` / `cover` / `excerpt` / `url`，无 `day` |
| 页面文案 | intro"我们以图文推文记录这段旅程，点击卡片即可阅读微信公众号原文。"；空态"暂无推文记录，敬请期待。" |
| 卡片渲染（临时样例） | 链接属性 / 封面 / 占位 / 日期 / 标题 / 摘要 / 阅读全文 均正确 |
| 样例推文 | 验证后已删除，产物恢复空态 |

---

## 结论

**验收通过。** `content/posts/` 数据目录与 `PostTimeline` 推文卡片组件骨架搭建完成，`diary.astro` 通过 `import.meta.glob` 读取推文 frontmatter 并按 date 升序排序传入组件；卡片含封面（缺省有 🎵 渐变占位）、日期、标题、两行省略摘要与"阅读全文"入口，整卡跳转微信原文并带 `target="_blank" rel="noopener noreferrer"`。页面文案已更新为推文定位，空态正常，dist 产物无任何 "Day" 标签。

**验证说明**：链接属性、封面占位、升序排序等依赖卡片渲染的项，通过临时创建两篇样例推文构建验证后已删除并重建，最终交付状态为合法的空目录（空态页）。

---

## 涉及文件

- `src/components/PostTimeline.astro` — 新增推文卡片组件
- `src/pages/diary.astro` — 读取 `content/posts/*.md`、升序排序、文案更新
- `content/posts/`（新）、`public/images/posts/`（新）— 数据与封面资源目录
