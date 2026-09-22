/**
 * site.config.js —— 站点全部内容配置
 *
 * 设计原则：HTML 只做结构（空壳），所有文案、图片、链接都从这里读取。
 * 修改任何文字或图片，只需编辑本文件，无需触碰 HTML / CSS / JS。
 */

module.exports = {
  // ── 基础信息 ────────────────────────────────────────────
  site: {
    title: '微光笔记',            // 浏览器标签 & 页头标题
    subtitle: '记录代码、阅读与生活', // 副标题
    description: '一个轻量、极简、专注于内容的个人博客模板',
    author: '元宝',
    language: 'zh-CN',
    url: 'https://example.github.io', // 用于 RSS / SEO
    since: 2024,
  },

  // ── 导航菜单 ────────────────────────────────────────────
  nav: [
    { label: '首页', href: '/' },
    { label: '归档', href: '/#archive' },
    { label: '标签', href: '/#tags' },
    { label: '友链', href: '/#links' },
    { label: '关于', href: '/#about' },
  ],

  // ── 社交链接 ────────────────────────────────────────────
  social: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/your-name' },
    { label: 'Email', icon: 'mail', href: 'mailto:hello@example.com' },
    { label: 'RSS', icon: 'rss', href: '/feed.xml' },
  ],

  // ── 页脚信息 ────────────────────────────────────────────
  footer: {
    copyright: '© 2024–{year} 微光笔记 · 用 ❤️ 与 Markdown 构建',
    icp: '',                     // 备案号，留空则不显示
    poweredBy: '基于 GitHub Pages · Markdown · 原生 JS 构建',
  },

  // ── 首页 Hero 区 ────────────────────────────────────────
  hero: {
    avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=blog', // 头像
    greeting: '你好，我是元宝 👋',
    bio: '前端工程师 / 业余写作者，在这里记录学到的东西，分享给同样在路上的你。',
    location: '📍 中国',
    stats: [
      { label: '篇文章', value: '12' },
      { label: '个标签', value: '8' },
      { label: '杯咖啡', value: '∞' },
    ],
  },

  // ── 关于我（关于页 / 首页关于卡片） ─────────────────────
  about: {
    heading: '关于我',
    paragraphs: [
      '热爱简洁的事物，相信好的内容不需要繁复的装饰。',
      '工作之外喜欢跑步、摄影和读闲书，偶尔把这些记录下来。',
      '这个博客用 Markdown 写作、GitHub Pages 托管，模板完全开源，欢迎取用。',
    ],
    skills: ['JavaScript', 'Node.js', 'Python', 'Markdown', 'Git'],
  },

  // ── 友链 ────────────────────────────────────────────────
  links: [
    { name: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog/', desc: '技术 · 思考' },
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/', desc: '前端权威文档' },
  ],

  // ── 文章列表（按时间倒序，越新越靠前） ─────────────────
  // 字段：slug=文件名(不含.md)  title  date  tags[]  excerpt  cover(可选封面)
  posts: [
    {
      slug: 'hello-world',
      title: '你好，世界：为什么我又写了一个博客',
      date: '2026-09-20',
      tags: ['随笔', '博客'],
      excerpt: '折腾博客大概是程序员的一种宿命。这是我的第 N 次尝试，也是目前最满意的一次。',
      cover: 'https://picsum.photos/seed/hello/800/420',
    },
    {
      slug: 'markdown-guide',
      title: 'Markdown 写作指南：让排版不再打断思路',
      date: '2026-09-12',
      tags: ['教程', 'Markdown'],
      excerpt: '从标题到代码块，从表格到脚注，一份足够日常使用的 Markdown 速查清单。',
      cover: 'https://picsum.photos/seed/md/800/420',
    },
    {
      slug: 'github-pages-deploy',
      title: '十分钟把博客部署到 GitHub Pages',
      date: '2026-08-28',
      tags: ['教程', 'GitHub'],
      excerpt: '零成本、免服务器、自动 HTTPS，个人博客最省心的托管方案。',
      cover: 'https://picsum.photos/seed/pages/800/420',
    },
    {
      slug: 'reading-2026',
      title: '2026 年读到一半的书',
      date: '2026-07-15',
      tags: ['阅读'],
      excerpt: '几本还没读完但已经想推荐的书，以及一些零碎的读后感。',
      cover: 'https://picsum.photos/seed/book/800/420',
    },
  ],

  // ── 文章页「上一篇 / 下一篇」文字 ──────────────────────
  postNav: {
    prev: '← 上一篇',
    next: '下一篇 →',
    backToList: '← 返回文章列表',
  },
};
