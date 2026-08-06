# AGENTS.md

## 速查

- **开发服务器**：`npm run dev` → http://localhost:4321/DianRhyme/（需先 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`，PowerShell 默认阻止脚本）
- **构建**：`npm run build` → 输出到 `dist/`
- **部署**：推送到 `main` → GitHub Actions 自动部署到 Pages
- **无 lint、typecheck、test 命令**
- **框架**：Astro 4.x（手动搭建，非 `create-astro` 脚手架）
- **环境要求**：Node ≥ 20、npm ≥ 10（见 README；CI 固定 Node 20）
- **工作方式**：只执行用户明确要求的改动；不要自作主张新增或修改文件（如自动补 `docs/changelog.md` 记录、顺手清理代码等），除非用户要求

## 关键：子路径 base

站点部署到 `finderlzy.github.io/DianRhyme/`，base 路径 `/DianRhyme/` 在 `astro.config.mjs:6` 设置。所有 `.astro` 文件和 Markdown 中的资源引用必须加此前缀，不能写 `/images/...`。

- `.astro` 文件中：用 `import.meta.env.BASE_URL`（解析为 `/DianRhyme/`）
- `content/` 下的 Markdown 文件中：直接写 `/DianRhyme/images/...`
- 例外：`index.astro` 的 `teamRows` 头像路径硬编码为 `/DianRhyme/images/avatars/...`（未用 BASE_URL），若改 base 需一并处理

## 架构

- **CMS、无动态数据、无 API 调用** —— 纯静态站点
- **内容**：`content/` 下的 Markdown 文件，构建时通过 `Astro.glob()` 读取
- **硬编码数据**：首页卡片和团队成员在 `src/pages/index.astro`（JS 数组 `infoItems`、`teamRows`），画廊条目在 `src/pages/gallery.astro`（`galleryGroups` 数组）
- **Astro.glob 路径**：相对于**调用该方法的 .astro 文件**而非项目根目录解析

### 内容文件

| 文件 | 控制内容 |
|------|---------|
| `content/posts/*.md` | 实践过程记录推文（改版中；落地后增删 = 创建/删除 .md 文件） |

⚠️ `content/overview.md`、`content/team.md` **未被任何页面读取**。首页"关于这次实践"正文和团队数据全部硬编码在 `src/pages/index.astro`，改这两个 .md 文件不会影响页面。

推文 `.md` 文件**必须**包含 frontmatter 字段：`date`、`title`、`cover`、`excerpt`、`url`，缺失会导致构建失败。`date` 为发布日期（排序依据），不包含 `day` 字段，页面不显示"Day N"标签。`cover` 写 `/DianRhyme/images/...`。

## 添加媒体

1. 将文件放入 `public/images/` 或 `public/videos/`
2. `.astro` 文件中引用为 `base + 'images/filename.jpg'`
3. Markdown 文件中引用为 `/DianRhyme/images/filename.jpg`
4. 文件名区分大小写

## 项目结构

```
src/pages/        — 3 个页面文件（index、diary、gallery）
src/layouts/      — BaseLayout.astro（导航 + 页脚布局）
src/components/   — NavBar、Footer、GalleryTimeline、Lightbox、InfoCard、TeamCard
src/styles/       — global.css（CSS 变量、暖色调主题）
content/          — 可编辑 Markdown（posts/、overview.md、team.md）
public/images/     — 图片资源
public/videos/     — 视频资源
docs/superpowers/specs/ — 设计文档（按日期命名）
docs/changelog.md  — 开发记录
```

## 常见陷阱

- 忘记加 `/DianRhyme/` 前缀 → 部署后资源 404
- 推文 frontmatter 缺少字段 → 构建报错
- `Astro.glob` 相对路径写错 → `AstroGlobNoMatch` 错误
- `npm run dev` 的地址是 `localhost:4321/DianRhyme/`（含 base），不是 `localhost:4321/`
- PowerShell 中直接 `npm run dev` 会因执行策略失败 → 先运行 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- 画廊 `type: 'video'` 条目有缺陷：`GalleryTimeline.astro:61` 用 `item.src` 渲染缩略 `<img>`，Lightbox 又用同一 `src` 播放 `<video>` —— 一个 `src` 无法同时是图片和视频。当前项目无视频文件；若要支持视频需给 `GalleryMedia` 增加独立 poster 字段