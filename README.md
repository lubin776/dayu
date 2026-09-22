# 微光笔记 · 极简博客模板

一个零依赖运行时、纯静态的 GitHub Pages 博客模板。

**核心理念：HTML 只留空壳，所有内容都在配置里。**

- 文章用 **Markdown** 写，提交后自动渲染到网页
- 所有文案、图片、链接都集中在 `site.config.js`，改内容不碰 HTML
- 不依赖 React / Vue，浏览器端零框架
- 支持标签云、归档、目录、代码复制、暗色模式

## 快速开始

```bash
git clone <你的仓库地址>
cd <仓库名>
npm install
node build.js        # 构建 → 输出到 dist/
npx serve dist       # 本地预览
```

开发时开启监听，文件改动自动重建：

```bash
node build.js --watch
```

## 目录结构

```
.
├── site.config.js        ← 全部文字/图片/链接内容
├── site.config.d.ts      ← 配置文件的类型定义（可选）
├── build.js              ← 构建脚本（注入配置 + 渲染 Markdown）
├── package.json
├── src/
│   ├── index.html        ← 首页空壳
│   ├── post.html         ← 文章页空壳
│   ├── styles.css        ← 样式（主题变量集中在 :root）
│   └── app.js            ← 前端交互
├── posts/                ← 放你的 .md 文章
│   ├── hello-world.md
│   ├── markdown-guide.md
│   ├── github-pages-deploy.md
│   └── reading-2026.md
└── .github/workflows/
    └── deploy.yml        ← 推送后自动部署
```

## 怎么写文章

在 `posts/` 目录新建一个 `<slug>.md` 文件，文件名就是访问路径（`/posts/<slug>.html`）：

```markdown
---
title: 文章标题
date: 2026-09-22
tags: [标签1, 标签2]
excerpt: 摘要，出现在卡片和 meta 描述里
cover: https://picsum.photos/seed/xxx/800/420
updated: 2026-09-23        # 可选
---

正文写在这里，支持完整的 GitHub Flavored Markdown。
```

然后在 `site.config.js` 的 `posts` 数组里加一条记录（用于首页列表展示），**`slug` 必须与文件名一致**：

```js
{
  slug: 'my-new-post',
  title: '我的新文章',
  date: '2026-09-22',
  tags: ['随笔'],
  excerpt: '一句话摘要',
  cover: 'https://...',   // 可选
}
```

> 提示：`build.js` 会优先读取每篇文章 front-matter 里的字段，配置里的值作为后备。所以两种写法都行。

## 怎么改内容

只改 `site.config.js`：

| 想改的东西 | 改哪个字段 |
| --- | --- |
| 站点标题、副标题 | `site.title` / `site.subtitle` |
| 头像 | `hero.avatar` |
| 首页自我介绍 | `hero.greeting` / `hero.bio` |
| 导航菜单 | `nav` |
| 社交链接 | `social` |
| 关于我 / 技能栈 | `about` |
| 友链 | `links` |
| 页脚文案、备案号 | `footer` |

换主题色只改 `src/styles.css` 里的 `--accent` 变量。

## 部署到 GitHub Pages

1. 把仓库改名为 `<用户名>.github.io`（或直接用任意仓库名 + 开启 Pages）
2. 进入仓库 **Settings → Pages**，Source 选 **GitHub Actions**
3. `git push` 到 `main` 分支，Actions 会自动构建并发布
4. 自定义域名：在仓库 Settings → Pages 里填域名，并加一条 `CNAME` 记录指向 `<用户名>.github.io`

## 支持的 Markdown 语法

标题、段落、加粗/斜体、列表、代码块、引用、链接、图片、表格、分割线、任务列表、删除线、HTML 混排。代码块自动加语言标签和一键复制按钮，文章超过 2 个标题时自动生成目录。

## License

MIT
