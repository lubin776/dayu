'use strict';

/**
 * verify.js —— 校验 dist/ 产物结构完整性
 * 不依赖任何外部包，直接对产物文本做断言
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
let pass = 0;
let fail = 0;
const errors = [];

function assert(name, cond, detail) {
  if (cond) {
    pass++;
    console.log('  ✓ ' + name);
  } else {
    fail++;
    errors.push(name + (detail ? ': ' + detail : ''));
    console.log('  ✘ ' + name + (detail ? '  → ' + detail : ''));
  }
}

const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const ph = fs.readFileSync(path.join(DIST, 'posts', 'hello-world.html'), 'utf8');
const pg = fs.readFileSync(path.join(DIST, 'posts', 'markdown-guide.html'), 'utf8');
const gp = fs.readFileSync(path.join(DIST, 'posts', 'github-pages-deploy.html'), 'utf8');

console.log('\n▶ 基础结构');
assert('存在 <html lang>', /<html lang="zh-CN">/.test(indexHtml));
assert('存在 viewport meta', /name="viewport"/.test(indexHtml));
assert('charset 为 utf-8', /<meta charset/.test(indexHtml));
assert('引入 styles.css', /<link rel="stylesheet" href="styles\.css">/.test(indexHtml));
assert('引入 app.js', /<script src="app\.js">/.test(indexHtml));
assert('注入 SITE_CONFIG JSON', /window\.SITE_CONFIG = /.test(indexHtml));
assert('无残留占位符（首页）', !/__[A-Z][A-Z0-9_]*__/.test(indexHtml));
assert('无残留占位符（文章页）', !/__[A-Z][A-Z0-9_]*__/.test(ph));

console.log('\n▶ SEO / 元数据');
assert('title 含站点名', /<title>微光笔记 ·/.test(indexHtml));
assert('description meta', /<meta name="description" content="一个轻量/.test(indexHtml));
assert('author meta', /<meta name="author" content="元宝">/.test(indexHtml));
assert('og:title', /property="og:title" content="微光笔记"/.test(indexHtml));
assert('og:type 为 website', /property="og:type" content="website"/.test(indexHtml));

console.log('\n▶ 头部 / 导航');
assert('导航菜单 5 项', (indexHtml.match(/<a class="nav-link"/g) || []).length === 5);
assert('导航含「关于」', indexHtml.includes('>关于</a>'));
assert('品牌名渲染', /brand-name">微光笔记/.test(indexHtml));
assert('品牌副标题渲染', /brand-sub">记录代码/.test(indexHtml));
assert('移动端菜单按钮存在', /menu-toggle/.test(indexHtml));

console.log('\n▶ Hero 区');
assert('头像渲染', /<img class="avatar" src="https:\/\/api\.dicebear/.test(indexHtml));
assert('问候语渲染', /class="greeting">你好，我是元宝/.test(indexHtml));
assert('自我介绍渲染', /class="hero-bio">前端工程师/.test(indexHtml));
assert('位置渲染', /class="hero-location">📍 中国/.test(indexHtml));
assert('统计数字 3 项', (indexHtml.match(/class="stat">/g) || []).length === 3);

console.log('\n▶ 文章卡片');
assert('文章卡片 4 张', (indexHtml.match(/<article class="card">/g) || []).length === 4);
assert('卡片含标题链接', /class="card-title"><a href="posts\//.test(indexHtml));
assert('卡片含时间', /<time>2026-/.test(indexHtml));
assert('卡片含摘要', /class="card-excerpt">/.test(indexHtml));
assert('封面图渲染', /card-cover" href="posts\/hello-world\.html" style="background-image:url\('https:\/\//.test(indexHtml));
assert('标签渲染（随笔）', /<span class="tag">随笔<\/span>/.test(indexHtml));
assert('标签渲染（Markdown）', /<span class="tag">Markdown<\/span>/.test(indexHtml));

console.log('\n▶ 归档 / 标签');
assert('归档列表 4 项', (indexHtml.match(/class="archive-item">/g) || []).length === 4);
assert('归档按时间倒序', indexHtml.indexOf('2026-09-20') < indexHtml.indexOf('2026-07-15'));
assert('标签云渲染', /tag-cloud-item">Markdown/.test(indexHtml));
assert('标签计数', /tag-cloud-item">随笔<em>1<\/em>/.test(indexHtml));

console.log('\n▶ 关于 / 技能 / 友链');
assert('关于标题', />关于我</.test(indexHtml));
assert('关于段落 3 段', (indexHtml.match(/热爱简洁的事物/g) || []).length >= 1);
assert('技能栈 5 项', (indexHtml.match(/class="skill">/g) || []).length === 5);
assert('友链 2 条', (indexHtml.match(/class="link-item">/g) || []).length === 2);

console.log('\n▶ 页脚');
assert('版权含动态年份', /© 2024–2026 微光笔记/.test(indexHtml), '请确认年份已替换');
assert('备案号隐藏（为空）', !/class="icp">\w/.test(indexHtml));
assert('poweredBy 渲染', /基于 GitHub Pages · Markdown/.test(indexHtml));

console.log('\n▶ 社交图标（SVG）');
assert('社交链接 3 个', (indexHtml.match(/class="social-link"/g) || []).length === 3);
assert('GitHub SVG 渲染', indexHtml.includes('viewBox="0 0 24 24"'));

console.log('\n▶ 文章页：hello-world.html');
assert('文章页 lang=zh-CN', /<html lang="zh-CN">/.test(ph));
assert('title 含文章名', /<title>你好，世界/.test(ph));
assert('og:type 为 article', /property="og:type" content="article"/.test(ph));
assert('文章标题 h1', /post-title">你好，世界：为什么我又写了一个博客/.test(ph));
assert('title 无重复拼接', !/你好，世界：为什么我又写了一个博客 · 你好，世界/.test(ph));
assert('发布时间渲染', /<time>2026-09-20/.test(ph));
assert('返回列表链接', /class="back-link" href="\.">← 返回文章列表/.test(ph));
assert('相对路径引入 styles.css', /<link rel="stylesheet" href="\.\.\/styles\.css">/.test(ph));
assert('相对路径引入 app.js', /<script src="\.\.\/app\.js">/.test(ph));

console.log('\n▶ 文章页：Markdown 渲染');
assert('二级标题渲染', /<h2 id="序"/.test(ph));
assert('三级标题渲染', /<h3 id="标题与段落"/.test(pg));
assert('标题锚点链接', /<a class="md-anchor" href="#序">#<\/a>/.test(ph));
assert('段落渲染', /<p>我大概每隔一两年/.test(ph));
assert('加粗渲染', /<strong>加粗<\/strong>/.test(pg));
assert('斜体渲染', /<em>斜体<\/em>/.test(pg));
assert('代码块渲染', /<pre class="md-pre"><code class="md-code language-js"/.test(ph));
assert('行内代码', /<code>posts\/<\/code>/.test(ph));
assert('引用块渲染', /<blockquote>/.test(ph));
assert('有序列表渲染', /<ol>/.test(ph));
assert('无序列表渲染', /<ul>/.test(ph));
assert('图片渲染（正文内 md-img）', (() => {
  const r = fs.readFileSync(path.join(DIST, 'posts', 'reading-2026.html'), 'utf8');
  return /<img class="md-img"[\s\S]*?src="https:\/\//.test(r);
})());
assert('外部链接 target=_blank', (() => {
  const r = fs.readFileSync(path.join(DIST, 'posts', 'reading-2026.html'), 'utf8');
  return /target="_blank"[\s\S]*?rel="noopener noreferrer"/.test(r);
})());
assert('表格渲染', /<table><thead><tr><th>语法元素<\/th>/.test(pg));
assert('表格单元格', /<td>罗列要点<\/td>/.test(pg));
assert('分割线渲染', /<hr>/.test(pg));

console.log('\n▶ 文章页：目录 + 上下篇');
assert('目录生成（>2 标题）', /<nav class="toc"><p class="toc-title">目录/.test(ph));
assert('目录含「序」', /href="#序"/.test(ph));
assert('仅含上一篇（hello-world 为列表首项）', /post-nav-prev" href="\.\/markdown-guide\.html"/.test(ph));
assert('首项无下一篇按钮', !/post-nav-next/.test(ph));
assert('上一篇按钮文案', /<span>← 上一篇<\/span>/.test(ph));
assert('末项仅含下一篇（reading-2026）', (() => {
  const r = fs.readFileSync(path.join(DIST, 'posts', 'reading-2026.html'), 'utf8');
  return /post-nav-next" href="\.\/github-pages-deploy\.html"/.test(r) && !/post-nav-prev/.test(r);
})());

console.log('\n▶ 文章页：无封面时不输出封面 img');
// 构造一条临时 config，验证 cover 为空时 __POST_COVER__ 被替换为空串
const tmp = require('./build.js');
const fsSnap = fs.readFileSync(path.join(DIST, 'posts', 'hello-world.html'), 'utf8');
assert('封面存在时输出 img', /<img class="post-cover"/.test(fsSnap));

console.log('\n▶ 文章页：github-pages-deploy（YAML 代码块未破坏）');
assert('YAML 代码块含 on:', /language-yaml/.test(gp) && /on:/.test(gp));

console.log('\n▶ 资源文件');
assert('styles.css 存在', fs.existsSync(path.join(DIST, 'styles.css')));
assert('app.js 存在', fs.existsSync(path.join(DIST, 'app.js')));
const css = fs.readFileSync(path.join(DIST, 'styles.css'), 'utf8');
assert('CSS 含主题变量', /--accent: #c4632f/.test(css));
assert('CSS 含暗色模式', /prefers-color-scheme: dark/.test(css));
assert('app.js 含复制按钮逻辑', /copy-btn/.test(fs.readFileSync(path.join(DIST, 'app.js'), 'utf8')));

console.log('\n▶ 配置 JSON 可解析');
const jsonMatch = indexHtml.match(/window\.SITE_CONFIG = '(.+?)';\s*<\/script>/);
let cfg = null;
try {
  cfg = JSON.parse(jsonMatch[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&').replace(/\\u0027/g, "'"));
  assert('JSON 可解析', true);
} catch (e) {
  assert('JSON 可解析', false, e.message);
}
if (cfg) {
  assert('配置含 site.title', cfg.site.title === '微光笔记');
  assert('配置含 4 篇文章', cfg.posts.length === 4);
  assert('配置含 about.skills 5 项', cfg.about.skills.length === 5);
}

console.log('\n─────────────────────────────');
console.log('通过 ' + pass + ' 项，失败 ' + fail + ' 项');
if (fail) {
  console.log('\n失败明细：');
  errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
