/* app.js —— 前端交互（无框架，原生 JS） */
(function () {
  'use strict';

  /* ── 移动端菜单 ─────────────────────────────────────── */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.classList.contains('nav-link')) nav.classList.remove('open');
    });
  }

  /* ── 代码块：一键复制 ───────────────────────────────── */
  document.querySelectorAll('.markdown-body pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.setAttribute('aria-label', '复制代码');
    pre.style.position = 'relative';
    pre.appendChild(btn);
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;
      copy(text).then(function () {
        btn.textContent = '已复制 ✓';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  });

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  /* ── 复制按钮样式（动态注入，避免污染 CSS 文件） ────── */
  var style = document.createElement('style');
  style.textContent =
    '.copy-btn{position:absolute;top:10px;right:10px;font-size:.75rem;padding:3px 10px;' +
    'border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#ddd;' +
    'border-radius:5px;cursor:pointer;opacity:0;transition:opacity .2s}.markdown-body pre:hover .copy-btn{opacity:1}' +
    '.copy-btn.copied{background:var(--accent);border-color:var(--accent);color:#fff}';
  document.head.appendChild(style);

  /* ── 目录高亮（仅文章页） ───────────────────────────── */
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = a;
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            tocLinks.forEach(function (a) {
              a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
            });
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ── 卡片入场动画 ───────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en, i) {
          if (en.isIntersecting) {
            en.target.style.animationDelay = i * 60 + 'ms';
            en.target.classList.add('fade-in');
            io2.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.card').forEach(function (c) {
      io2.observe(c);
    });
  }
})();
