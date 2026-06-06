# 三书世界

这是一个本地静态学习站，用《道德经》《孙子兵法》《周易》建立更高维的世界理解框架。主导航按书本原始大纲组织，模型索引从章节笔记和标签中横向聚合。

## 内容来源

- 《道德经》：Project Gutenberg #7337
- 《孙子兵法》：Project Gutenberg #23864
- 《周易》：Project Gutenberg #25501

古籍原文来自公开底本；白话理解、逻辑拆解、现实映射和观察练习由本项目重新整理，不复制现代译注。

## 常用命令

```bash
pnpm install
pnpm fetch:sources
pnpm build:content
pnpm check:content
pnpm dev
```

## 数据流

- `data/raw/authoritative/` 保存手动下载确认过的优先底本。
- `data/raw/` 保存脚本下载的备用底本。
- `data/manual/chapters/{bookId}/{chapterId}.json` 保存人工白话、关键词、逻辑模型、现实例子和总结。
- `scripts/build-content.mjs` 将三本书解析成章节、篇章和卦条，并合并人工 JSON。
- `src/data/content.ts` 是轻量目录索引，用于首屏和导航。
- `src/data/chapters/{bookId}/{chapterId}.json` 是按章节生成的懒加载内容。
- `data/generated/content.json` 和 `data/generated/content-index.json` 方便校对、扩展或导出。

人工内容不要写进 TypeScript 文件；编辑 `data/manual/chapters/**` 后运行 `pnpm build:content`。

## 样式系统

- 颜色、背景、字体、间距和阅读区比例集中在 `src/styles/tokens.css`。
- 页面结构样式在 `src/App.css`，优先引用 token 变量，方便后续频繁调整主题。
- 章节正文按需加载，避免三本书全部进入首屏包。

## 学习节奏

- 平日 10-20 分钟：读一小段原文，看一条白话理解，记一个现实观察。
- 周末 60-90 分钟：复盘本周案例，把观察归到具体章节和模型标签。
- 三个月主线：第 1 个月《道德经》，第 2 个月《孙子兵法》，第 3 个月《周易》。
