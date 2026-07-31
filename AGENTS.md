# AGENTS.md

## 速查

- **开发服务器**：`npm run dev` → http://localhost:4321/DianRhyme/（需先 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`，PowerShell 默认阻止脚本）
- **构建**：`npm run build` → 输出到 `dist/`
- **部署**：推送到 `main` → GitHub Actions 自动部署到 Pages
- **无 lint、typecheck、test 命令**
- **框架**：Astro 4.x（手动搭建，非 `create-astro` 脚手架，兼容 Node 20）

## 关键：子路径 base

站点部署到 `finderlzy.github.io/DianRhyme/`，base 路径 `/DianRhyme/` 在 `astro.config.mjs:6` 设置。所有 `.astro` 文件和 Markdown 中的资源引用必须加此前缀，不能写 `/images/...`。

- `.astro` 文件中：用 `import.meta.env.BASE_URL`（解析为 `/DianRhyme/`）
- `content/` 下的 Markdown 文件中：直接写 `/DianRhyme/images/...`

## 架构

- **CMS、无动态数据、无 API 调用** —— 纯静态站点
- **内容**：`content/` 下的 Markdown 文件，构建时通过 `Astro.glob()` 读取
- **硬编码数据**：首页卡片和团队成员在 `src/pages/index.astro`（JS 数组 `infoItems`、`teamRows`），画廊条目在 `src/pages/gallery.astro`（`galleryGroups` 数组）
- **Astro.glob 路径**：相对于**调用该方法的 .astro 文件**而非项目根目录解析

### 内容文件

| 文件 | 控制内容 |
|------|---------|
| `content/diaries/day*.md` | 实践日记（增删 = 创建/删除 .md 文件） |
| `content/overview.md` | 首页"关于这次实践"正文 |
| `content/team.md` | 团队信息（极少修改） |

日记 `.md` 文件**必须**包含 frontmatter 字段：`day`、`date`、`title`。缺失会导致构建失败。

## 添加媒体

1. 将文件放入 `public/images/` 或 `public/videos/`
2. `.astro` 文件中引用为 `base + 'images/filename.jpg'`
3. Markdown 文件中引用为 `/DianRhyme/images/filename.jpg`
4. 文件名区分大小写

## 项目结构

```
src/pages/        — 3 个页面文件（index、diary、gallery）
src/layouts/      — BaseLayout.astro（导航 + 页脚布局）
src/components/   — NavBar、Footer、DiaryTimeline、GalleryTimeline、Lightbox、InfoCard、TeamCard
src/styles/       — global.css（CSS 变量、暖色调主题）
content/          — 可编辑 Markdown（diaries/、overview.md、team.md）
public/images/     — 图片资源
public/videos/     — 视频资源
docs/superpowers/specs/ — 设计文档（按日期命名）
docs/changelog.md  — 开发记录
```

## 常见陷阱

- 忘记加 `/DianRhyme/` 前缀 → 部署后资源 404
- 日记 frontmatter 缺少字段 → 构建报错
- `Astro.glob` 相对路径写错 → `AstroGlobNoMatch` 错误
- `npm run dev` 的地址是 `localhost:4321/DianRhyme/`（含 base），不是 `localhost:4321/`
- PowerShell 中直接 `npm run dev` 会因执行策略失败 → 先运行 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`