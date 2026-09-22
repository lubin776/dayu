'use strict';

/**
 * lib/markdown.js —— 零依赖的 Markdown → HTML 渲染器
 *
 * 支持：GFM 标题 / 段落 / 加粗斜体删除线 / 行内代码 / 链接 / 图片 /
 *       引用 / 有序无序列表 / 任务列表 / 代码块(fenced) / 表格 / 分割线 / 自动链接
 * 仅供本模板构建期使用，不追求完整 CommonMark 兼容性。
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 行内解析：code -> strong -> em -> del -> link -> image，按顺序避免冲突 */
function inline(text) {
  // 先保护代码段
  const codes = [];
  text = text.replace(/`([^`]+)`/g, function (_, c) {
    codes.push(c);
    return '' + (codes.length - 1) + '';
  });

  let out = escapeHtml(text);

  // 图片 ![alt](src "title")
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
    function (_, alt, src, title) {
      return (
        '<img class="md-img" src="' +
        src +
        '" alt="' +
        alt +
        '"' +
        (title ? ' title="' + title + '"' : '') +
        '>'
      );
    }
  );

  // 链接 [text](href)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, href) {
    const ext = /^https?:\/\//.test(href);
    return (
      '<a href="' +
      href +
      '"' +
      (ext ? ' target="_blank" rel="noopener noreferrer"' : '') +
      '>' +
      t +
      '</a>'
    );
  });

  // 加粗 **x** 优先于斜体（跳过行内代码占位符，避免误伤）
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*((?:[^*\u0001\u0002]|\u0001\d+\u0002)+)\*(?=[\s.,!?;:)\]]|$)/g, '$1<em>$2</em>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 还原代码段（最后处理，避免里面被再次解析）
  out = out.replace(/(\d+)/g, function (_, i) {
    return '<code>' + escapeHtml(codes[Number(i)]) + '</code>';
  });

  return out;
}

/** 解析表格行 */
function parseTableRow(line) {
  const cells = [];
  let s = line.replace(/^\s*|\s*$/g, '');
  if (s[0] === '|') s = s.slice(1);
  if (s[s.length - 1] === '|') s = s.slice(0, -1);
  let buf = '';
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '`') inCode = !inCode;
    if (c === '|' && !inCode) {
      cells.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  cells.push(buf.trim());
  return cells;
}

function render(md) {
  const lines = String(md).replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;

  function isFence(l) {
    return /^```/.test(l);
  }
  function isTableSep(l) {
    return /^\s*\|?\s*:?-{3,}/.test(l.replace(/\|/g, function (m) { return m; })) && /\|/.test(l);
  }

  while (i < lines.length) {
    let line = lines[i];

    // 代码块（fenced）
    if (isFence(line)) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // 跳过结束 ```
      const code = escapeHtml(buf.join('\n'));
      out.push(
        '<pre class="md-pre"><code class="md-code language-' +
          lang +
          '" data-lang="' +
          lang +
          '">' +
          code +
          '</code></pre>'
      );
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2]);
      const id = stripTags(text)
        .toLowerCase()
        .replace(/[^\w一-龥]+/g, '-')
        .replace(/^-|-$/g, '');
      out.push(
        '<h' +
          level +
          ' id="' +
          id +
          '" class="md-h md-h' +
          level +
          '"><a class="md-anchor" href="#' +
          id +
          '">#</a>' +
          text +
          '</h' +
          level +
          '>'
      );
      i++;
      continue;
    }

    // 分割线
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // 引用
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + render(buf.join('\n')).join('') + '</blockquote>');
      continue;
    }

    // 表格
    if (
      i + 1 < lines.length &&
      /^\s*\|/.test(line) &&
      /\|\s*:?-{3,}/.test(lines[i + 1].replace(/^\s*\|/, '').replace(/\|$/, ''))
    ) {
      const header = parseTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      let html = '<table><thead><tr>';
      header.forEach(function (c) {
        html += '<th>' + inline(c) + '</th>';
      });
      html += '</tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr>';
        r.forEach(function (c) {
          html += '<td>' + inline(c) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      out.push(html);
      continue;
    }

    // 无序列表
    if (/^[-*+]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      out.push('<ul>' + buf.map(function (b) { return '<li>' + inline(b) + '</li>'; }).join('') + '</ul>');
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      out.push('<ol>' + buf.map(function (b) { return '<li>' + inline(b) + '</li>'; }).join('') + '</ol>');
      continue;
    }

    // 空行
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // 段落（吞并后续非空、非特殊行）
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !isFence(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i]) &&
      !/^\s*\|/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push('<p>' + inline(buf.join(' ')) + '</p>');
  }

  return out;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

module.exports = { render };
