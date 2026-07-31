# Team Card 交互与布局 Design Spec（最终版）

## 概述

修改首页团队成员卡片（`TeamCard`）的默认展示状态与悬停展开行为，使其在收起时以**圆形头像 + 姓名（在圆圈内）+ 职务**为核心，悬停时向右展开显示照片占位和 bio 简介。固定高度确保布局稳定。

## 团队数据分组（index.astro）

三行布局保持不变，所有行统一使用 `expandDirection: 'right'`：

| 行 | 成员 | expandDirection |
|---|---|---|
| 第一行 | 孙雅楠（指导老师）、郭辉（指导学姐） | `right` |
| 第二行 | 雷梓宸（队长）、张尧（副队长） | `right` |
| 第三行 | 杜雅芬、李昭琰、邓剑、巴宗胜、曾嘉 | `right` |

## TeamCard 组件变更

### 文件：`src/components/TeamCard.astro`

### 变更 1：默认状态布局调整

**当前**：头像圆圈（左侧，固定 44px）+ `.card-info`（姓名 + 职务，右侧紧邻）

**改为**：头像居中（上方），姓名在圆圈内，职务在姓名下方，整体垂直居中排列

```
  ┌────────┐
  │ initials │   ← 圆圈 48px，名字缩写在圆内
  │ (circle) │
  └────────┘
    姓名
    职务
```

细节：
- `.avatar-circle` 尺寸从 `44px` 调整为 `48px`
- `.avatar-circle--photo` 尺寸从 `56px` 调整为 `50px`
- `.card-left` 改为 `flex-direction: column; align-items: center; text-align: center; gap: 2px`
- `.card-name` font-size 从 `0.92rem` 调整为 `0.78rem`
- `.card-role` font-size 从 `0.78rem` 调整为 `0.7rem`
- `.initials` font-size 从 `0.92rem` 调整为 `0.7rem`
- `.initials--photo` font-size 从 `1.15rem` 调整为 `0.78rem`
- `.photo-img` 尺寸从 `56px` 调整为 `50px`

### 变更 2：展开时照片占位改进

悬停时 `.card-photo` 中若无真实头像，显示一个渐变背景圆形占位：
- 背景：`linear-gradient(135deg, var(--color-primary-light), var(--color-accent))`
- 内容：姓名缩写（同默认状态）
- 尺寸：50px × 50px（与默认头像圈一致）

### 变更 3：固定高度（收起 / 展开）

为 `.team-card` 添加固定高度，避免内容自适应导致的边框遮挡问题：
- 收起状态：`height: 100px`
- 展开状态：`height: 120px`
- 过渡：`height 0.35s ease`

### 变更 4：展开阴影增强

悬停时 `.team-card` 的 `box-shadow` 从 `var(--shadow-sm)` 过渡到 `var(--shadow-lg)`，增强层次感。

### 变更 5：展开过渡微调

保持现有的 `max-width` + `margin-left` 过渡方案：
- `.team-card--right` 宽度：`155px` → `500px`
- `.card-photo` max-width：`0` → `50px`，margin-left：`0` → `14px`
- `.card-bio` max-width：`0` → `250px`，margin-left：`0` → `12px`
- `.card-bio p` font-size 从 `0.9rem` 调整为 `0.8rem`

### 变更 6：移除 overlay 相关代码

删除 `.team-card--overlay` 及其所有相关 CSS 和 `.card-overlay` HTML 块。不再使用 `overlay` 展开方向。

## 全局样式变动

无。所有变更均在 `TeamCard.astro` 内完成。

## 验收标准

1. 默认状态：圆形头像 + 姓名在圆内 + 职务在下方，居中排列，边框不遮挡内容
2. 悬停时：卡片平滑向右展开，左侧信息不变，右侧出现照片占位 + bio 文字
3. 鼠标离开：平滑收回到默认状态
4. 所有三行均使用 `right` 展开，无 `overlay`
5. 移动端（≤ 768px）：卡片宽度 100%，展开不超出容器
6. 头像圆圈渐变色过渡自然