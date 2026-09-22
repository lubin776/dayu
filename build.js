#!/usr/bin/env node
/**
 * build.js —— 构建脚本
 *
 * 职责：读取 site.config.js，把内容注入 HTML 空壳，生成最终页面。
 *   - 首页：src/index.html  →  dist/index.html
 *   - 文章：src/post.html   →  dist/posts/<slug>.html（每篇一份）
 *
 * 用法：  node build.js           # 生产构建
 *         node build.js --watch   # 监听文件变化自动重建
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { render: mdRender } = require('./lib/markdown.js');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const POSTS_DIR = path.join(ROOT, 'posts');
const CONFIG = require('./site.config.js');

// ── 工具函数 ──────────────────────────────────────────────
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}

/** 转义后塞进 JSON 注入，防止 XSS / 引号破坏 */
function toJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

/** 根据当前页位置生成相对路径：首页 / 子页互跳都正确 */
function rel(baseIsPost, targetIsPost) {
  if (baseIsPost && !targetIsPost) return '..';      // posts/x.html → index
  if (!baseIsPost && targetIsPost) return 'posts';   // index → posts/x.html
  return '.';                                       // 同层
}

function postUrl(slug, fromPost) {
  return (fromPost ? '.' : 'posts') + '/' + slug + '.html';
}

/** 解析 front-matter（--- 包裹的 YAML 头） */
function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    // 数组 tags: [a, b, c]
    const arr = value.match(/^\[(.*)\]$/);
    if (arr) {
      meta[m[1]] = arr[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      continue;
    }
    // 去掉引号
    meta[m[1]] = value.replace(/^["'](.*)["']$/, '$1');
  }
  return { meta, body: match[2] };
}

function formatDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (isNaN(d)) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── 渲染首页 ──────────────────────────────────────────────
function buildIndex() {
  const tpl = read(path.join(SRC, 'index.html'));

  // 文章列表项
  const postCards = CONFIG.posts
    .map((p) => {
      const tags = (p.tags || [])
        .map((t) => `<span class="tag">${t}</span>`)
        .join('');
      const cover = p.cover
        ? `<a class="card-cover" href="${postUrl(p.slug)}" style="background-image:url('${p.cover}')"></a>`
        : '';
      return `
      <article class="card">
        ${cover}
        <div class="card-body">
          <div class="card-meta"><time>${formatDate(p.date)}</time>${tags}</div>
          <h3 class="card-title"><a href="${postUrl(p.slug)}">${p.title}</a></h3>
          <p class="card-excerpt">${p.excerpt}</p>
        </div>
      </article>`;
    })
    .join('');

  // 归档列表
  const archiveItems = CONFIG.posts
    .map(
      (p) =>
        `<li class="archive-item"><time>${formatDate(p.date)}</time><a href="${postUrl(p.slug)}">${p.title}</a></li>`
    )
    .join('');

  // 标签云
  const tagMap = new Map();
  CONFIG.posts.forEach((p) => (p.tags || []).forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
  const tagsHtml = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `<span class="tag-cloud-item">${t}<em>${n}</em></span>`)
    .join('');

  // 技能条
  const skillsHtml = CONFIG.about.skills.map((s) => `<li class="skill">${s}</li>`).join('');

  // 关于段落
  const aboutHtml = CONFIG.about.paragraphs.map((p) => `<p>${p}</p>`).join('');

  // 友链
  const linksHtml = CONFIG.links
    .map(
      (l) =>
        `<li class="link-item"><a href="${l.url}" target="_blank" rel="noopener">${l.name}</a><span>${l.desc}</span></li>`
    )
    .join('');

  // 统计数字
  const statsHtml = CONFIG.hero.stats
    .map((s) => `<div class="stat"><b>${s.value}</b><span>${s.label}</span></div>`)
    .join('');

  // 社交图标
  const socialHtml = CONFIG.social
    .map(
      (s) =>
        `<a class="social-link" href="${s.href}" aria-label="${s.label}" title="${s.label}">${ICONS[s.icon] || s.label}</a>`
    )
    .join('');

  const navHtml = CONFIG.nav
    .map((n) => {
      const local = n.href.startsWith('/') ? '.' + n.href : n.href;
      return `<a class="nav-link" href="${local}">${n.label}</a>`;
    })
    .join('');

  const siteTitle = CONFIG.site.title; // 固定站点标题，供占位符统一引用
  const year = new Date().getFullYear();
  const copyright = CONFIG.footer.copyright.replace('{year}', year);
  const icp = CONFIG.footer.icp ? `<div class="icp">${CONFIG.footer.icp}</div>` : '';

  let html = tpl;
  const replacements = {
    '__SITE_TITLE__': siteTitle,
    '__SITE_SUBTITLE__': CONFIG.site.subtitle,
    '__BRAND_TITLE__': siteTitle,
    '__BRAND_SUB__': CONFIG.site.subtitle,
    '__SITE_DESCRIPTION__': CONFIG.site.description,
    '__SITE_AUTHOR__': CONFIG.site.author,
    '__SITE_LANG__': CONFIG.site.language,
    '__NAV__': navHtml,
    '__BACK_HREF__': '.',
    '__STYLES_HREF__': 'styles.css',
    '__APP_HREF__': 'app.js',
    '__RSS_HREF__': 'feed.xml',
    '__SOCIAL__': socialHtml,
    '__AVATAR__': CONFIG.hero.avatar,
    '__GREETING__': CONFIG.hero.greeting,
    '__BIO__': CONFIG.hero.bio,
    '__LOCATION__': CONFIG.hero.location || '',
    '__STATS__': statsHtml,
    '__POST_CARDS__': postCards,
    '__ARCHIVE_ITEMS__': archiveItems,
    '__TAGS__': tagsHtml,
    '__ABOUT__': aboutHtml,
    '__ABOUT_HEADING__': CONFIG.about.heading,
    '__SKILLS__': skillsHtml,
    '__LINKS__': linksHtml,
    '__COPYRIGHT__': copyright,
    '__ICP__': icp,
    '__POWERED__': CONFIG.footer.poweredBy,
    '__CONFIG_JSON__': toJson(CONFIG),
  };
  for (const [key, val] of Object.entries(replacements)) {
    html = html.split(key).join(val);
  }

  const missed = html.match(/__[A-Z][A-Z0-9_]*__/g);
  if (missed) {
    const uniq = [...new Set(missed)];
    throw new Error('首页存在未替换的占位符: ' + uniq.join(', '));
  }

  write(path.join(DIST, 'index.html'), html);
  console.log(`✔ 首页 → dist/index.html  (${CONFIG.posts.length} 篇文章)`);
}

// ── 渲染文章页 ────────────────────────────────────────────
function buildPosts() {
  const tpl = read(path.join(SRC, 'post.html'));
  ensureDir(path.join(DIST, 'posts'));

  CONFIG.posts.forEach((p, i) => {
    const mdFile = path.join(POSTS_DIR, p.slug + '.md');
    if (!fs.existsSync(mdFile)) {
      console.warn(`✘ 找不到文章源文件: posts/${p.slug}.md`);
      return;
    }

    const { meta, body } = parseFrontMatter(read(mdFile));
    const title = meta.title || p.title;
    const date = meta.date || p.date;
    const tags = meta.tags || p.tags || [];
    const excerpt = meta.excerpt || p.excerpt || '';
    const cover = meta.cover || p.cover || '';
    const siteTitle = CONFIG.site.title; // 固定站点标题，避免被文章 front-matter 覆盖

    const html = mdRender(body);
    const toc = extractToc(body);
    const tagsHtml = tags.map((t) => `<span class="tag">${t}</span>`).join('');

    const prev = CONFIG.posts[i + 1];
    const next = CONFIG.posts[i - 1];
    const prevHtml = prev
      ? `<a class="post-nav-link post-nav-prev" href="${postUrl(prev.slug, true)}"><span>${CONFIG.postNav.prev}</span><b>${prev.title}</b></a>`
      : '';
    const nextHtml = next
      ? `<a class="post-nav-link post-nav-next" href="${postUrl(next.slug, true)}"><span>${CONFIG.postNav.next}</span><b>${next.title}</b></a>`
      : '';

    // 文章页内所有跨层链接都改成相对路径，保证二级目录也能正常跳转
    const navHtml = CONFIG.nav
      .map((n) => {
        const local = n.href.startsWith('/') ? '.' + n.href : n.href;
        return `<a class="nav-link" href="${local}">${n.label}</a>`;
      })
      .join('');
    const socialHtml = CONFIG.social
      .map(
        (s) =>
          `<a class="social-link" href="${s.href}" aria-label="${s.label}" title="${s.label}">${ICONS[s.icon] || s.label}</a>`
      )
      .join('');
    const year = new Date().getFullYear();
    const copyright = CONFIG.footer.copyright.replace('{year}', year);
    const icp = CONFIG.footer.icp ? `<div class="icp">${CONFIG.footer.icp}</div>` : '';

    let out = tpl;
    const replacements = {
      '__SITE_TITLE__': title + ' · ' + siteTitle,
      '__SITE_SUBTITLE__': CONFIG.site.subtitle,
      '__BRAND_TITLE__': siteTitle,
      '__BRAND_SUB__': CONFIG.site.subtitle,
      '__PAGE_TITLE__': title,
      '__SITE_DESCRIPTION__': excerpt,
      '__SITE_AUTHOR__': CONFIG.site.author,
      '__SITE_LANG__': CONFIG.site.language,
      '__NAV__': navHtml,
      '__SOCIAL__': socialHtml,
      '__POST_TITLE__': title,
      '__POST_DATE__': formatDate(date),
      '__POST_UPDATED__': meta.updated ? formatDate(meta.updated) : '',
      '__POST_TAGS__': tagsHtml,
      '__POST_COVER__': cover ? `<img class="post-cover" src="${cover}" alt="${title}">` : '',
      '__POST_BODY__': html,
      '__POST_TOC__': toc,
      '__POST_NAV_PREV__': prevHtml,
      '__POST_NAV_NEXT__': nextHtml,
      '__POST_BACK__': CONFIG.postNav.backToList,
      // 相对路径版本（文章页位于 posts/ 二级目录）
      '__BACK_HREF__': '.',
      '__STYLES_HREF__': '../styles.css',
      '__APP_HREF__': '../app.js',
      '__COPYRIGHT__': copyright,
      '__ICP__': icp,
      '__POWERED__': CONFIG.footer.poweredBy,
      '__CONFIG_JSON__': toJson(CONFIG),
    };
    // 文章页的 <title> 已在模板里写成 "文章名 · 站点名"，
    // 但 __SITE_TITLE__ 在模板多处出现，需先做 title 拼接再统一替换剩余占位符
    out = out.replace('__POST_TITLE__ · __SITE_TITLE__', title + ' · ' + siteTitle);
    out = out.replace('__SITE_TITLE__ · __SITE_TITLE__', siteTitle);
    for (const [key, val] of Object.entries(replacements)) {
      out = out.split(key).join(val);
    }

    const missed = out.match(/__[A-Z][A-Z0-9_]*__/g);
    if (missed) {
      const uniq = [...new Set(missed)];
      throw new Error('文章 ' + p.slug + ' 存在未替换的占位符: ' + uniq.join(', '));
    }

    write(path.join(DIST, 'posts', p.slug + '.html'), out);
  });

  console.log(`✔ 文章 → dist/posts/*.html`);
}

/** 从 Markdown 提取标题生成目录 */
function extractToc(md) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  const tocRoot = [];
  const stack = [];
  let inCode = false;
  lines.forEach((line) => {
    if (/^```/.test(line)) {
      inCode = !inCode;
      return;
    }
    if (inCode) return;
    const m = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (!m) return;
    const level = m[1].length;
    const text = m[2].replace(/`/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, '-')
      .replace(/^-|-$/g, '');
    const item = { level, text, id, children: [] };
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(item);
    else tocRoot.push(item);
    stack.push(item);
  });
  if (tocRoot.length < 2) return '';
  function render(list) {
    return (
      '<ul>' +
      list
        .map(
          (it) =>
            '<li><a href="#' +
            it.id +
            '">' +
            escapeHtml(it.text) +
            '</a>' +
            (it.children.length ? render(it.children) : '') +
            '</li>'
        )
        .join('') +
      '</ul>'
    );
  }
  return '<nav class="toc"><p class="toc-title">目录</p>' + render(tocRoot) + '</nav>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── SVG 图标 ──────────────────────────────────────────────
const ICONS = {
  github:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-1.92c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"/></svg>',
  mail:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  rss:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/></svg>',
};

// ── 复制静态资源 ──────────────────────────────────────────
function copyAssets() {
  const srcCss = path.join(SRC, 'styles.css');
  const srcJs = path.join(SRC, 'app.js');
  if (fs.existsSync(srcCss)) write(path.join(DIST, 'styles.css'), read(srcCss));
  if (fs.existsSync(srcJs)) write(path.join(DIST, 'app.js'), read(srcJs));
  // 复制其他静态资源（图片等）
  const staticDir = path.join(ROOT, 'static');
  if (fs.existsSync(staticDir)) {
    copyDir(staticDir, path.join(DIST, 'static'));
  }
}

function copyDir(from, to) {
  ensureDir(to);
  fs.readdirSync(from).forEach((f) => {
    const s = path.join(from, f);
    const d = path.join(to, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else write(d, read(s));
  });
}

// ── 入口 ──────────────────────────────────────────────────
function build() {
  ensureDir(DIST);
  buildIndex();
  buildPosts();
  copyAssets();
  console.log('✔ 构建完成 → dist/');
}

if (require.main === module) {
  const watch = process.argv.includes('--watch') || process.argv.includes('-w');
  build();
  if (watch) {
    const chokidar = (() => {
      try {
        return require('chokidar');
      } catch {
        return null;
      }
    })();
    if (!chokidar) {
      console.warn('提示：未安装 chokidar，使用内置 fs.watch（功能有限）。推荐 npm i -D chokidar');
      const targets = [SRC, POSTS_DIR, path.join(ROOT, 'site.config.js')];
      targets.forEach((t) => {
        if (fs.existsSync(t)) {
          fs.watch(t, { recursive: true }, () => {
            console.log('\n⟳ 检测到变化，重新构建...');
            try {
              build();
            } catch (e) {
              console.error('✘ 构建失败:', e.message);
            }
          });
        }
      });
    } else {
      const watcher = chokidar.watch([SRC, POSTS_DIR, 'site.config.js', 'build.js'], {
        ignoreInitial: true,
      });
      watcher.on('all', (event, file) => {
        console.log(`\n⟳ [${event}] ${path.relative(ROOT, file)} → 重新构建...`);
        try {
          build();
        } catch (e) {
          console.error('✘ 构建失败:', e.message);
        }
      });
      console.log('👀 监听中...  (Ctrl+C 退出)');
    }
  }
}

module.exports = { build };
