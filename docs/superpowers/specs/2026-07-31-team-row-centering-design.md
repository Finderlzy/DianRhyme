# Team 卡片行居中 Design Spec

## 概述

首页"团队成员"三行卡片（2 人 / 2 人 / 5 人）目前靠左对齐（`.team-row` 是 `display: flex` 且未设置 `justify-content`，默认 `flex-start`）。目标：每行卡片作为一个整体水平居中。

## 变更 1：行居中

### 文件：`src/pages/index.astro`（`.team-row` 样式，约 256 行）

```css
.team-row {
  display: flex;
  align-items: center;
  justify-content: center;   /* 新增 */
  gap: 10px;
  margin-bottom: 16px;
}
```

效果：
- 初始状态：三行各自居中（2 人行窄块、5 人行宽块，形成上窄下宽的对称布局）
- 悬停展开：行实时对称重新居中（展开卡片向两边平均推挤相邻卡片）
- ≤900px 断点：`flex-wrap: wrap` 换行后的每一行线段同样居中
- ≤768px 断点：卡片 `width: 100%`，一行一张，不受影响

## 变更 2：悬停展开横向溢出修复

5 人行悬停展开时总宽约 1160px（4×155 + 500 + 4×10），超过容器内容宽 1052px，窄屏下会出现页面横向滚动条（现状已有）。居中后溢出变为对称，需裁剪：

### 文件：`src/pages/index.astro`（`.team` 区域样式）

```css
.team {
  overflow-x: hidden;   /* 新增 */
}
```

作用域限定在团队区域，避免全局 `body` 级裁剪掩盖站点其他潜在的横向溢出。

## 不做的事（YAGNI）

- 不改 TeamCard.astro（卡片尺寸、悬停展开逻辑均不变）
- 不统一三行宽度（用户已确认选"每行整体居中"而非"三行等宽对齐"）
- 不动全局样式（global.css 无改动）

## 验收标准

1. 三行卡片初始状态各自水平居中
2. 悬停任一卡片，行对称展开，页面无横向滚动条
3. ≤900px 换行后各行线段居中
4. ≤768px 移动端卡片全宽展示，行为不变
5. 除上述两项外无其他视觉回归（global.css、TeamCard.astro 未改动）
