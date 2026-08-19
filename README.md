# 和音滇韵

<div align="center">

<img src="assets/logo.png" alt="和音滇韵团队标识" width="220">

**北京科技大学“酉良和音滇韵民族团结实践团”成果展示网站**

[在线访问](https://finderlzy.github.io/DianRhyme/) · [GitHub Actions](https://github.com/Finderlzy/DianRhyme/actions)

</div>

> 以音乐为桥，连接京滇山海。

## 项目简介

这是团队 2026 年暑期赴云南省澜沧拉祜族自治县开展音乐支教与民族团结实践的数字记录。网站以“十四日音乐支教田野纪事”为主线，整理实践日志、团队成员与现场影像，记录课堂、走访和共同生活中的相遇。

## 页面

- **首页**：项目导语、三幕相遇、精选纪事与同行者。
- **十四日纪事**：按日期阅读实践日志，包含序章筹备记录与 7 月 26 日起的主时间轴。
- **影像档案**：以图册和照片空间两种方式浏览现场影像；移动端优先使用图册模式。


## 项目结构

```text
content/posts/       实践日志 Markdown 内容
public/images/       Logo、团队合照、日志封面、现场影像与成员照片
src/pages/           首页、纪事页、影像档案页和 404 页面
src/components/      导航、页脚、时间线和成员信息组件
src/data/            日志与影像数据
src/three/           影像档案中的 Three.js 照片空间
tests/               单元测试与页面资源回归检查
```

## 技术栈

[Astro](https://astro.build/) · TypeScript · Three.js · Vitest · 原生 CSS

和音滇韵，山海有声。
