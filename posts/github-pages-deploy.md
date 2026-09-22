---
title: 十分钟把博客部署到 GitHub Pages
date: 2026-08-28
tags: [教程, GitHub]
excerpt: 零成本、免服务器、自动 HTTPS，个人博客最省心的托管方案。
cover: https://picsum.photos/seed/pages/800/420
---

## 为什么选 GitHub Pages

- **免费**：静态站点托管不收一分钱
- **自动 HTTPS**：证书帮你管好了
- **免运维**：不用碰服务器、不用装环境
- **原生支持 Jekyll**：当然你也可以用自己的构建流程

对于只想安静写点东西的人来说，几乎没有更省心的方案了。

## 步骤

### 1. 新建仓库

仓库名必须是 `<你的用户名>.github.io`，比如 `yuanbao.github.io`。

### 2. 克隆到本地

```bash
git clone https://github.com/你的用户名/你的用户名.github.io.git
cd 你的用户名.github.io
```

### 3. 把模板文件放进去

```
.
├── site.config.js    ← 所有文字和图片都在这里
├── build.js          ← 构建脚本
├── src/              ← HTML 空壳 + 样式
├── posts/            ← 放你的 .md 文章
└── package.json
```

### 4. 本地预览

```bash
npm install
node build.js
# 然后用任意静态服务器预览
npx serve dist
```

### 5. 配置自动构建（推荐）

在仓库里加一个工作流文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node build.js
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

之后你只需要 `git push`，剩下的事 GitHub 全包了。

## 注意事项

- 仓库设置里要把 Pages 的源设为 **GitHub Actions**
- 自定义域名只需在 `dist/` 里放一个 `CNAME` 文件
- 免费版有带宽限制，但对个人博客来说基本用不满

**整个过程，比写一篇文章的功夫还短。**
