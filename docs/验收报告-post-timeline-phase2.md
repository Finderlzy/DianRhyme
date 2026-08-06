# 验收报告 — post-timeline Phase 2 示例数据验证

**验收日期**：2026-08-06
**验收对象**：用 3 条乱序临时推文验证 `PostTimeline` 组件在真实数据状态下的 ① 日期升序排序 ② 封面图片显示 ③ cover 缺失容错 ④ 移动端响应式布局；验证后清空临时数据恢复空态
**验收依据**：开发计划 Phase 2 要求（注：`docs/2026-08-06-post-timeline-plan.md` 不存在，按任务消息内嵌的 Phase 2 要求执行）
**验收方式**：静态构建产物检查（产物 HTML 结构校验 + CSS 规则校验）

---

## 验收环境

- Node.js / npm 构建环境，`npm run build` 产出 `dist/`
- 校验对象：`dist/diary/index.html`、`content/posts/`

---

## 测试数据（故意乱序 + 缺 cover）

| 文件 | date | title | cover |
|------|------|-------|-------|
| `temp-1.md` | 2026-07-30 | 验证推文B - 歌声与微笑 | `day1-classroom.jpg` |
| `temp-1a.md` | 2026-07-27 | 验证推文A - 落地澜沧 | `day0-arrival.jpg` |
| `temp-1c.md` | 2026-08-02 | 验证推文C - 合唱排练 | **不填**（验证容错） |

写入顺序故意与日期顺序不一致；期望输出顺序：`2026-07-27` → `2026-07-30` → `2026-08-02`。

---

## 验收标准与结果

| # | 验收标准 | 验证方式 | 结果 | 证据 |
|---|----------|----------|------|------|
| 1 | 三条标题均存在 | 产物检查 | ✅ 通过 | `dist/diary/index.html` 含"验证推文A / 验证推文B / 验证推文C"三处标题 |
| 2 | 顺序符合 date 升序 | 产物结构检查 | ✅ 通过 | 产物中卡片按 `2026-07-27`(A) → `2026-07-30`(B) → `2026-08-02`(C) 依次出现，与文件写入顺序（07-30/07-27/08-02）无关 |
| 3 | cover 缺失不构建失败 | 构建日志 | ✅ 通过 | 含缺 cover 推文时 `npm run build` 成功（`3 page(s) built in 613ms`） |
| 4 | cover 缺失不产生空 src 图片 | grep | ✅ 通过 | 产物无 `src=""` / `src="#"`；缺 cover 推文未渲染 `<img>` |
| 5 | cover 缺失显示默认占位 | 产物检查 | ✅ 通过 | 推文C 渲染 `<div class="post-cover post-cover-placeholder"><span class="post-cover-icon">🎵</span></div>` |
| 6 | 封面图片正常显示 | 产物检查 | ✅ 通过 | 推文A/B 渲染 `<img src="/DianRhyme/images/day0-arrival.jpg|day1-classroom.jpg" ...>`，`object-fit:cover` |
| 7 | 移动端 ≤600px 卡片不横向溢出 | CSS 校验 | ✅ 通过 | `@media (max-width:600px)` 中 `.post-card{flex-direction:column}`，配合基础规则 `.post-card{overflow:hidden}` |
| 8 | 移动端图片切换为顶部通栏 | CSS 校验 | ✅ 通过 | 同一媒体查询中 `.post-cover,.post-cover-placeholder{width:100%;height:180px;min-height:0}` |
| 9 | 移动端内容区正常显示 | CSS 校验 | ✅ 通过 | 同一媒体查询中 `.post-body{padding:16px 20px}`，内容垂直排列，宽度随卡片撑满 |
| 10 | 验证后删除临时数据 | 文件系统检查 | ✅ 通过 | `content/posts/` 仅剩 `.gitkeep`，3 个 `temp-*.md` 已删除 |
| 11 | 删除后重新构建恢复空态 | 构建日志 + 产物检查 | ✅ 通过 | 重建成功（`3 page(s) built in 534ms`），`dist/diary/index.html` 恢复"暂无推文记录，敬请期待。"，无 `验证推文` / `_test_` 残留 |

---

## 关键决策与理由

| 决策 | 选择 | 理由 |
|------|------|------|
| 排序逻辑 | 在 `diary.astro` 中将 `date` 经 `new Date()` 归一化为时间戳 `dateValue`，按 `a.dateValue - b.dateValue` 升序 | YAML 会把日期解析为 Date 对象，时间戳比较稳定无歧义；不依赖 frontmatter 写入顺序，文件在目录中的排列不影响展示 |
| cover 缺失容错 | 组件层 `post.cover ? <img> : <div class="post-cover-placeholder">🎵</div>` | 条件渲染杜绝 `src=""` 破图；占位沿用项目既有渐变风格，视觉不突兀；构建不因字段缺失而失败 |
| 移动端布局 | ≤600px 断点：卡片 `flex-direction:column`、封面 `width:100%; height:180px` 顶部通栏、`overflow:hidden` 兜底 | 竖屏窄宽度下横向卡片（200px 封面+正文）必然溢出，改为纵向堆叠后封面占满宽度、正文自然排列，三处规则配合保证无横向滚动 |

---

## 数据核对

| 项目 | 结果 |
|------|------|
| 产物卡片渲染顺序 | A(07-27) → B(07-30) → C(08-02) |
| 封面缺失渲染 | `post-cover-placeholder` + 🎵，无空 src |
| 临时文件删除后 `content/posts/` | 仅 `.gitkeep` |
| 最终产物状态 | 空态"暂无推文记录，敬请期待。" |
| 最终 `dist/diary/index.html` 残留 `_test_` / 验证推文 | 0 处 |
| 构建次数 / 结果 | 2 次（含数据 + 清空后），均 `3 page(s) built` 成功 |

---

## 结论

**验收通过。** 3 条乱序临时推文正确按 date 升序渲染为 `2026-07-27 → 2026-07-30 → 2026-08-02`；封面正常显示，缺 cover 推文不构建失败、无空 src、渲染默认渐变占位；≤600px 媒体查询下卡片纵向堆叠、封面顶部通栏、无横向溢出。临时数据已全部删除并重新构建，`content/posts/` 恢复为空目录（仅 `.gitkeep`），页面恢复空态，无任何测试数据残留。

**验证说明**：响应式布局为代码级 CSS 规则校验，最终视觉以浏览器实机（`npm run dev` → http://localhost:4321/DianRhyme/diary）为准。

---

## 涉及文件

- `content/posts/temp-1.md`、`temp-1a.md`、`temp-1c.md` — 临时测试数据（已删除）
- `dist/diary/index.html` — 验证产物
- 复用组件：`src/components/PostTimeline.astro`、`src/pages/diary.astro`（Phase 1 产物，本轮未改动）
