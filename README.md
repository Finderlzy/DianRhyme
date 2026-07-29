# 和音滇韵

> 北京科技大学"酉良和音滇韵"实践团 · 音乐支教成果展示网页

[![Deploy to GitHub Pages](https://github.com/Finderlzy/DianRhyme/actions/workflows/deploy.yml/badge.svg)](https://github.com/Finderlzy/DianRhyme/actions)

## 项目简介

2026 年盛夏，北科大"酉良和音滇韵"实践团的 7 名成员跨越千里来到云南省澜沧拉祜族自治县，开展了为期 12 天的音乐支教活动。本仓库是此次社会实践的成果展示网页。

**在线访问**：https://finderlzy.github.io/DianRhyme/

## 技术栈

- **框架**：[Astro](https://astro.build) 4.x — 静态站点生成器
- **内容管理**：Markdown（`.md` 文件）
- **样式**：原生 CSS（自定义属性 + 暖色调主题）
- **部署**：GitHub Pages + GitHub Actions 自动构建部署
- **字体**：Noto Serif SC（Google Fonts）

## 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 实践概况、团队介绍 |
| 实践日记 | `/diary` | 时间线列表 + 点击展开详情 |
| 图片视频 | `/gallery` | 三列画廊 + 注释气泡 + Lightbox |

## 本地开发

### 环境要求

- Node.js ≥ 20
- npm ≥ 10

### 开始开发

```bash
# 克隆项目
git clone https://github.com/Finderlzy/DianRhyme.git
cd DianRhyme

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:4321/DianRhyme/` 查看效果。文件修改后自动热更新。

### 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 项目结构

```
DianRhyme/
├── src/
│   ├── pages/               # 页面文件
│   │   ├── index.astro      # 首页
│   │   ├── diary.astro      # 实践日记
│   │   └── gallery.astro    # 图片视频
│   ├── layouts/
│   │   └── BaseLayout.astro # 公共布局（导航 + 页脚）
│   ├── components/          # 可复用组件
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── DiaryTimeline.astro
│   │   ├── GalleryTimeline.astro
│   │   ├── Lightbox.astro
│   │   ├── InfoCard.astro
│   │   └── TeamCard.astro
│   └── styles/
│       └── global.css       # 全局样式 + CSS 变量
├── content/                 # ⭐ 可编辑内容（Markdown）
│   ├── diaries/             # 每日日记（day0.md, day1.md, ...）
│   ├── overview.md          # 首页概况
│   └── team.md              # 团队信息
├── public/
│   ├── images/              # 图片资源
│   └── videos/              # 视频资源
├── astro.config.mjs         # Astro 配置
├── 需求文档.md               # 需求说明
├── 使用指南.md               # 内容编辑指南
└── 开发总结.md               # 开发过程记录
```

## 内容编辑

所有可编辑内容在 `content/` 目录下，使用 Markdown 格式。图片放到 `public/images/` 下。

详细操作指南见 **[使用指南.md](使用指南.md)**，包括：
- 如何修改每个页面的内容
- 如何新增/修改/删除实践日记
- 如何管理图片和视频
- 如何部署更新

## 部署

本项目通过 GitHub Actions 自动部署到 GitHub Pages。

```bash
# 日常更新流程
npm run build          # 构建
git add -A
git commit -m "update: 描述"
git push               # 推送后自动部署
```

每次推送到 `main` 分支后，GitHub Actions 自动构建并部署。可在 [Actions 页面](https://github.com/Finderlzy/DianRhyme/actions) 查看部署状态。

## 设计

- **配色**：暖色调 — 琥珀/蜂蜜主色，米黄背景，淡绿点缀
- **字体**：Noto Serif SC（标题），系统无衬线（正文）
- **风格**：柔和、简约、干净，呼应支教与云南的民族文化氛围

## 团队

北科大"酉良和音滇韵"实践团 · 7 名成员 · 2026 年暑期社会实践

## 许可

本项目为社会实践成果展示用途。
