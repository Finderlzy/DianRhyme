# 开发记录

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
| v1.2 | 2026-07-31 | 团队介绍 UI 改造 |
| v1.1 | 2026-07 | 项目初始化