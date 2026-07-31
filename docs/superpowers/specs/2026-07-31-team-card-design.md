# Team Card 交互与布局 Design Spec

## 概述

修改首页团队成员卡片（`TeamCard`）的默认展示状态与悬停展开行为，使其在收起时以**圆形头像 + 姓名（在圆圈内）+ 职务**为核心，悬停时向右展开显示照片占位和 bio 简介。

## 团队数据分组（index.astro）

三行布局保持不变，仅调整第三行的 `expandDirection` 从 `'overlay'` 改为 `'right'`：

| 行 | 成员 | expandDirection |
|---|---|---|
| 第一行 | 孙雅楠（指导老师）、郭辉（指导学姐） | `right` |
| 第二行 | 雷梓宸（队长）、张尧（副队长） | `right` |
| 第三行 | 杜雅芬、李昭琰、邓剑、巴宗胜、曾嘉 | `right` |

## TeamCard 组件变更

### 文件：`src/components/TeamCard.astro`

### 变更 1：默认状态布局调整

**当前**：头像圆圈（左侧，固定 44px） + `.card-info`（姓名 + 职务，右侧紧邻）

**改为**：头像居中（上方），姓名在圆圈内/紧邻下方，职务在姓名下方，整体垂直居中排列

```
  ┌────────┐
  │  initials │   ← 圆圈 52px，名字缩写在圆内
  │  (circle) │
  └────────┘
    姓名
    职务
```

细节：
- `.avatar-circle` 尺寸从 `44px` 调整为 `52px`
- `.card-left` 改为 `flex-direction: column; align-items: center; text-align: center; gap: 6px`
- `.card-name` font-size 从 `0.92rem` 调整为 `0.85rem`
- `.card-role` font-size 从 `0.78rem` 调整为 `0.75rem`，颜色不变
- `.initials` font-size 从 `0.92rem` 调整为 `0.8rem`
- `.avatar-circle--photo` 尺寸从 `56px` 调整为 `52px`（与默认一致）
- `.photo-img` 尺寸从 `56px` 调整为 `52px`
- `.initials--photo` font-size 从 `1.15rem` 调整为 `0.9rem`

### 变更 2：展开时照片占位改进

悬停时 `.card-photo` 中若无真实头像，显示一个与默认头像同款但稍大的圆形占位：
- 背景：`linear-gradient(135deg, var(--color-primary-light), var(--color-accent))`
- 内容：姓名缩写（同默认状态）
- 尺寸：56px × 56px（略大于默认态，突出展开后内容更丰富的视觉层次）

### 变更 3：展开阴影增强

悬停时 `.team-card` 的 `box-shadow` 从 `var(--shadow-sm)` 过渡到 `var(--shadow-lg)`，增强层次感。

### 变更 4：展开过渡微调

保持现有的 `max-width` + `margin-left` 过渡方案：
- `.team-card--right` 宽度：`155px` → `500px`
- `.card-photo` max-width：`0` → `56px`，margin-left：`0` → `14px`
- `.card-bio` max-width：`0` → `250px`，margin-left：`0` → `12px`

不新增动画属性，避免性能问题。

### 变更 5：移除 overlay 相关代码

删除 `.team-card--overlay` 及其所有相关 CSS 和 `.card-overlay` HTML 块。不再使用 `overlay` 展开方向。

## 全局样式变动

无。所有变更均在 `TeamCard.astro` 内完成。

## 验收标准

1. 默认状态：圆形头像 + 姓名在圆内 + 职务在下方，居中排列
2. 悬停时：卡片平滑向右展开，左侧信息不变，右侧出现照片占位 + bio 文字
3. 鼠标离开：平滑收回到默认状态
4. 所有三行均使用 `right` 展开，无 `overlay`
5. 移动端（≤ 768px）：卡片宽度 100%，展开不超出容器
6. 头像圆圈渐变色过渡自然