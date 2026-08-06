# 和音滇韵

> 北京科技大学"酉良和音滇韵民族团结实践团" · 音乐支教成果展示网页

[![Deploy to GitHub Pages](https://github.com/Finderlzy/DianRhyme/actions/workflows/deploy.yml/badge.svg)](https://github.com/Finderlzy/DianRhyme/actions)

**在线访问**：https://finderlzy.github.io/DianRhyme/

## 这是什么

2026 年盛夏，北科大"酉良和音滇韵民族团结实践团"的 9 名成员跨越千里来到云南省澜沧拉祜族自治县，开展了为期 14 天的音乐支教活动。本仓库是此次社会实践的成果展示网页：

- **首页** — 实践概况、关于这次实践、团队成员
- **实践过程记录** — 推文时间线，点击卡片跳转微信原文
- **图片视频** — 时间线画廊 + 注释 + 点击放大

## 改内容只需要记住 3 件事

| 想改什么 | 操作 | 文件 |
|----------|------|------|
| **实践过程记录（推文）** | 编辑 `content/posts/*.md` 文件 | 封面图存于 `public/images/posts/`，引用路径以 `/DianRhyme/` 开头 |
| **图片视频页** | 编辑 `galleryGroups` 数组 | `src/pages/gallery.astro` |
| **首页文字 / 团队成员** | 编辑 `infoItems` / `teamRows` 数组 | `src/pages/index.astro` |

- 图片放在 `public/images/` 文件夹中
- 引用图片的路径必须以 `/DianRhyme/` 开头（网站部署在子路径下，写 `/images/...` 线上会 404）

> 每一步的详细图文操作见 **[使用指南.md](使用指南.md)**——如何编辑推文、添加照片、替换团队头像、发布更新等。

## 本地预览

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:4321/DianRhyme/`（注意地址带 `/DianRhyme/`）。修改文件后自动热更新。

## 发布更新

```bash
npm run build          # 1. 构建（内容有问题会在这里报错）
git add -A             # 2. 暂存
git commit -m "update: 描述改了什么"
git push               # 3. 推送 → GitHub Actions 自动部署
```

推送后约 1-2 分钟生效，可在 [Actions 页面](https://github.com/Finderlzy/DianRhyme/actions) 查看进度。

## 技术栈

Astro 4（静态站点生成）+ 原生 CSS。需要 Node.js ≥ 20、npm ≥ 10。

## 项目结构

```
content/posts/      ★ 实践过程记录推文
src/pages/          index.astro（首页）、diary.astro、gallery.astro（画廊数据）
public/images/      图片资源（含团队成员头像）
使用指南.md          ★ 内容编辑分步教程
```

> 注：`content/overview.md`、`content/team.md` 是早期遗留文件，**不会被网页读取**，改了不会生效。首页正文和团队数据都硬编码在 `src/pages/index.astro` 中。

## 其他文档

- [使用指南.md](使用指南.md) — 内容编辑教程（最常用）
- [需求文档.md](需求文档.md) — 项目需求说明
- [开发总结.md](开发总结.md) — 开发过程记录
- `docs/` — 开发记录（changelog）、验收报告、设计文档
