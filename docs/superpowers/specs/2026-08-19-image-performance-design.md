# 全站图片性能优化设计

## 边界

保留布局、裁切、文字、35 条 Moment 数据和 Three.js 核心交互；原图迁入 `assets/images-original`，不进入 `dist`，由生成脚本向 `public/images` 写入可部署衍生文件，继续承接旧 `/DianRhyme/images/...` URL。

## 资源管线

`scripts/generate-images.mjs` 以源文件 SHA-256 与配方版本增量生成 480/960/1920 WebP、最长边不超过 1920 的原路径 JPEG/PNG 兼容文件、favicon 和 `src/generated/image-manifest.ts`。Sharp 统一处理 EXIF 方向和元数据；任何缺图、解码或写入错误均报告逻辑路径并以非零退出。`predev`、`prestart`、`prebuild` 调用同一脚本。

## 页面接口

`src/lib/images.ts` 将逻辑路径、frontmatter 旧路径和 GitHub Pages base path 统一映射为 `ResponsiveImageSource`。`ResponsiveImage.astro` 输出 1920 回退 `src`、三档 `srcset`、源宽高和既有加载属性。页面公开图片全部通过该接口；OG 保留兼容 URL，favicon 使用生成小图。

## 影像运行时

`Moment` 增加缩略图、srcset 和尺寸字段但保留 `src`。图册内容只在图册模式挂载，星图模式卸载，并保留完整 `noscript` 图册。星图动态导入 Three.js；初始化只加载 480px 缩略图，并发 6。高清加载由点击触发，使用独立并发 2 队列和按逻辑图片缓存，失败时保留缩略图；实例退出时释放全部 Three.js 资源。

## 验证

先覆盖资源清单、响应式映射、35 条 Moment、惰性高清加载、失败回退、并发和释放行为的单元测试，再运行 `npm test`、`npm run build`、`git diff --check`。构建 preview 使用全新上下文、禁用缓存，测量首页、桌面星图和移动图册请求数、图片传输量、重复 URL、动态 Three.js chunk 和旧 URL 状态。
