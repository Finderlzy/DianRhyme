# 团队成员真人照片展示 Design Spec

## 概述

为首页团队成员卡片（`TeamCard`）添加真人照片。**折叠态保持现状不变**（彩色圆圈 + 姓名缩写 + 职务）；悬停展开时，将目前的渐变圆形照片占位替换为 **96×96 方形圆角真人照片**，并相应上调展开态卡片高度，确保布局不变形。

## 需求确认（讨论结论）

- 9 位成员（孙雅楠、郭辉、雷梓宸、张尧、杜雅芬、李昭琰、邓剑、巴宗胜、曾嘉）**均有**可用照片
- 照片目前存在但**尚未放入项目**，实施时需先放入 `public/images/avatars/`
- 折叠态：**不变**，仍显示彩色圆圈 + 姓名后两字缩写
- 展开态照片形式：**方形圆角** → 最终定为**竖长矩形 96×120px、圆角 10px**（竖幅源图配合 `object-fit: cover` 主要裁剪左右，避免切掉头顶头发）

## 照片资源

- 目录：`public/images/avatars/`
- 命名（拼音小写）：`sunyanan.jpg`、`guohui.jpg`、`leizichen.jpg`、`zhangyao.jpg`、`duyafen.jpg`、`lizhaoyan.jpg`、`dengjian.jpg`、`bashengsheng.jpg`、`zengjia.jpg`
- 建议源图至少 400×400px；`object-fit: cover` 会自动裁剪，任何宽高比均可用

## 变更清单

### 变更 1：绑定照片 —— `src/pages/index.astro`

将 `teamRows` 中 9 位成员的 `avatar: ''` 全部改为真实路径，格式：

```
/DianRhyme/images/avatars/<拼音>.jpg
```

路径必须带 `/DianRhyme/` 前缀（与项目现有约定一致）。`TeamCard` 已支持 `avatar` 属性，无需改组件接口。

### 变更 2：照片样式 —— `src/components/TeamCard.astro`

| 选择器 | 现值 | 改后 |
|--------|------|------|
| `.photo-img` | 50×50 圆形（`border-radius: 50%`） | **96×120 竖长、`border-radius: 10px`**、`object-fit: cover` 不变 |
| `.card-photo` 展开 max-width | `56px` | **`110px`**（容纳照片 + 左边距） |
| `.card-photo` 展开 margin-left | `14px` | 保持 `14px` |
| `.team-card:hover` height | `120px` | **`140px`**（容纳 120px 照片 + 呼吸感） |
| 无照片占位 `.avatar-circle--photo` | 50×50 圆形渐变 | **96×120 竖长圆角渐变**（`border-radius: 10px`），`initials--photo` 字号改为 `1.3rem` |

展开宽度预算校验：展开态 500px = 左侧信息 48 + 照片 110 + 简介 250 + 内边距 ≈ 460px，空间充足，不挤压。

### 变更 3：文档同步

- `使用指南.md` 1.6 节：将"头像 200×200 圆形"说明更新为"方形圆角照片，放入 `public/images/avatars/`，命名约定及路径写法"
- `content/team.md`：无需改动（不涉及头像）
- `docs/changelog.md`：追加 v1.3 记录（TeamCard 真人照片展示）

## 不做的事（YAGNI）

- 不改折叠态圆圈为照片
- 不引入 Astro `<Image>` 优化（与现有画廊纯 `<img>` 模式保持一致，收益有限）
- 不重构卡片布局

## 验收标准

1. 折叠态视觉与现状完全一致（彩色圆圈 + 缩写 + 职务）
2. 悬停展开后，中部显示 96×120 圆角真人照片，头部完整、不变形
3. 展开过渡平滑，卡片高度从 100px 过渡到 140px，无跳动、无边框遮挡
4. 无照片的成员（若有）显示方形圆角渐变占位，风格统一
5. 三行卡片均正常；移动端（≤768px）卡片宽度 100%，照片不溢出
6. `npm run build` 通过

## 涉及文件

| 文件 | 变更 |
|---|---|
| `public/images/avatars/*.jpg` | 新增 9 张照片 |
| `src/pages/index.astro` | 9 处 `avatar` 路径填充 |
| `src/components/TeamCard.astro` | 照片尺寸/形状、展开高度、占位样式 |
| `使用指南.md` | 1.6 节头像说明更新 |
| `docs/changelog.md` | v1.3 记录 |

