#!/usr/bin/env node
/**
 * Red Thread · Der rote Faden — design bible + sketchbook.
 *
 * Zero-dependency Node server, written to be dropped into Atrium on the
 * Mac Studio. No auth by design: bind it behind Tailscale like the other
 * local apps. See README.md for tile registration.
 *
 * Routes:
 *   GET  /red-thread                    view page (rendered bible + sketchbook)
 *   GET  /red-thread/edit               edit mode (raw markdown textarea)
 *   GET  /red-thread/raw                raw markdown, text/plain
 *   POST /red-thread/save               full content (form field "content" or raw text body)
 *   POST /red-thread/sketchbook/upload  multipart: photo, rt, caption
 *   GET  /red-thread/sketchbook/img/:file
 *   GET  /red-thread/health             { ok: true } for the tile status dot
 *   GET  /                              redirects to /red-thread
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '7788', 10);
const DATA_DIR = process.env.RED_THREAD_DATA || path.join(__dirname, 'data');
const BIBLE_FILE = path.join(DATA_DIR, 'red-thread-bible.md');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');
const SKETCH_DIR = path.join(DATA_DIR, 'sketchbook');
const SKETCH_INDEX = path.join(SKETCH_DIR, 'index.json');
const SEED_FILE = path.join(__dirname, 'seed', 'red-thread-bible.md');

// ---------------------------------------------------------------- storage

function ensureStorage() {
  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  fs.mkdirSync(SKETCH_DIR, { recursive: true });
  if (!fs.existsSync(BIBLE_FILE)) {
    fs.copyFileSync(SEED_FILE, BIBLE_FILE);
  }
  if (!fs.existsSync(SKETCH_INDEX)) {
    fs.writeFileSync(SKETCH_INDEX, '[]\n');
  }
}

function timestamp(d = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return (
    d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
  );
}

function saveBible(content) {
  // Snapshot first, so no version is ever lost — even if the write below fails.
  if (fs.existsSync(BIBLE_FILE)) {
    const snap = path.join(VERSIONS_DIR, `red-thread-bible-${timestamp()}.md`);
    fs.copyFileSync(BIBLE_FILE, snap);
  }
  fs.writeFileSync(BIBLE_FILE, content);
  return new Date();
}

function readSketchIndex() {
  try {
    return JSON.parse(fs.readFileSync(SKETCH_INDEX, 'utf8'));
  } catch {
    return [];
  }
}

function writeSketchIndex(entries) {
  fs.writeFileSync(SKETCH_INDEX, JSON.stringify(entries, null, 2) + '\n');
}

// ------------------------------------------------------- markdown renderer

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:)]|$)/g, '$1<em>$2</em>');
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let list = null; // 'ul' | 'ol'
  let para = [];

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const closePara = () => {
    if (para.length) {
      out.push('<p>' + para.map(inline).join('<br>') + '</p>');
      para = [];
    }
  };

  for (const raw of lines) {
    const line = escapeHtml(raw);
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closePara(); closeList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      continue;
    }
    if (/^---+\s*$/.test(line)) { closePara(); closeList(); out.push('<hr>'); continue; }
    const ul = line.match(/^-\s+(.*)$/);
    if (ul) {
      closePara();
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      const cb = ul[1].match(/^\[( |x)\]\s+(.*)$/i);
      if (cb) {
        const checked = cb[1].toLowerCase() === 'x' ? ' checked' : '';
        out.push(`<li class="task"><input type="checkbox" disabled${checked}> ${inline(cb[2])}</li>`);
      } else {
        out.push(`<li>${inline(ul[1])}</li>`);
      }
      continue;
    }
    const ol = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (ol) {
      closePara();
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(ol[2])}</li>`);
      continue;
    }
    if (/^\s*$/.test(line)) { closePara(); closeList(); continue; }
    closeList();
    para.push(line);
  }
  closePara(); closeList();
  return out.join('\n');
}

// ------------------------------------------------------------------ layout

const CSS = `
:root {
  --bg: #0d0d10; --panel: #16161c; --panel2: #1d1d25;
  --text: #d8d5cf; --muted: #7d7a74; --line: #2a2a33;
  --red: #c0392b; --red-soft: #e07a6a; --green: #3fb96b;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.wrap { max-width: 860px; margin: 0 auto; padding: 2rem 1.25rem 5rem; }
header.app { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; margin-bottom: .25rem; }
header.app h1 { font-size: 1.45rem; margin: 0; font-weight: 650; }
header.app h1 .thread { color: var(--red-soft); }
.meta { color: var(--muted); font-size: .85rem; margin-bottom: 1.5rem; }
.toolbar { margin-left: auto; display: flex; gap: .5rem; }
a.btn, button.btn {
  display: inline-block; padding: .4rem .95rem; border-radius: 8px;
  border: 1px solid var(--line); background: var(--panel); color: var(--text);
  font-size: .9rem; text-decoration: none; cursor: pointer;
}
a.btn:hover, button.btn:hover { border-color: var(--red-soft); color: #fff; }
button.btn.primary { background: var(--red); border-color: var(--red); color: #fff; }
button.btn.primary:hover { background: #d34534; }
article.bible { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 1.5rem 2rem 2rem; }
article.bible h1 { font-size: 1.6rem; border-bottom: 2px solid var(--red); padding-bottom: .5rem; }
article.bible h2 { font-size: 1.25rem; margin-top: 2.2rem; color: #efece6; border-bottom: 1px solid var(--line); padding-bottom: .3rem; }
article.bible h3 { font-size: 1.05rem; margin-top: 1.6rem; color: var(--red-soft); }
article.bible li { margin: .25rem 0; }
article.bible li.task { list-style: none; margin-left: -1.2rem; }
article.bible hr { border: none; border-top: 1px solid var(--line); }
textarea.editor {
  width: 100%; min-height: 70vh; resize: vertical;
  background: var(--panel); color: var(--text); border: 1px solid var(--line);
  border-radius: 12px; padding: 1.25rem;
  font: 13.5px/1.6 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
textarea.editor:focus { outline: none; border-color: var(--red-soft); }
section.sketchbook { margin-top: 3rem; }
section.sketchbook h2 { font-size: 1.2rem; border-bottom: 1px solid var(--line); padding-bottom: .3rem; }
form.upload {
  display: flex; gap: .6rem; flex-wrap: wrap; align-items: center;
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
  padding: .9rem 1rem; margin: 1rem 0 1.5rem;
}
form.upload input[type=text] {
  background: var(--panel2); border: 1px solid var(--line); color: var(--text);
  border-radius: 8px; padding: .4rem .7rem; font-size: .9rem;
}
form.upload input[name=rt] { width: 7.5rem; }
form.upload input[name=caption] { flex: 1; min-width: 12rem; }
form.upload input[type=file] { color: var(--muted); font-size: .85rem; max-width: 15rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.card img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: var(--panel2); }
.card .info { padding: .55rem .75rem .7rem; }
.card .rt { color: var(--red-soft); font-weight: 650; font-size: .85rem; letter-spacing: .03em; }
.card .cap { color: var(--muted); font-size: .8rem; margin-top: .1rem; }
.empty { color: var(--muted); font-size: .9rem; }
`;

function page(title, body) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head><body><div class="wrap">${body}</div></body></html>`;
}

function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function sketchbookHtml() {
  const entries = readSketchIndex().slice().sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
  const cards = entries.map((e) => `
    <div class="card">
      <a href="/red-thread/sketchbook/img/${encodeURIComponent(e.file)}" target="_blank">
        <img src="/red-thread/sketchbook/img/${encodeURIComponent(e.file)}" alt="${escapeHtml(e.rt || '')}">
      </a>
      <div class="info">
        <div class="rt">${escapeHtml(e.rt || '')}</div>
        ${e.caption ? `<div class="cap">${escapeHtml(e.caption)}</div>` : ''}
      </div>
    </div>`).join('');
  return `
  <section class="sketchbook">
    <h2>Sketchbook</h2>
    <form class="upload" method="POST" action="/red-thread/sketchbook/upload" enctype="multipart/form-data">
      <input type="text" name="rt" placeholder="RT-001" required>
      <input type="text" name="caption" placeholder="Caption (optional)">
      <input type="file" name="photo" accept="image/*" required>
      <button class="btn primary" type="submit">Upload</button>
    </form>
    ${entries.length ? `<div class="grid">${cards}</div>` : '<p class="empty">No sketches yet. Photograph a page and upload it with its RT number.</p>'}
  </section>`;
}

function viewPage() {
  const md = fs.readFileSync(BIBLE_FILE, 'utf8');
  const saved = fs.statSync(BIBLE_FILE).mtime;
  const body = `
  <header class="app">
    <h1><span class="thread">Red Thread</span> · Der rote Faden</h1>
    <div class="toolbar"><a class="btn" href="/red-thread/edit">Edit</a></div>
  </header>
  <div class="meta">Last saved ${fmtDate(saved)} · <a href="/red-thread/raw" style="color:inherit">raw</a></div>
  <article class="bible">${renderMarkdown(md)}</article>
  ${sketchbookHtml()}`;
  return page('Red Thread · Der rote Faden', body);
}

function editPage() {
  const md = fs.readFileSync(BIBLE_FILE, 'utf8');
  const body = `
  <header class="app">
    <h1><span class="thread">Red Thread</span> · Der rote Faden — Edit</h1>
  </header>
  <form id="editform" method="POST" action="/red-thread/save">
    <textarea class="editor" name="content" spellcheck="false">${escapeHtml(md)}</textarea>
    <p>
      <button class="btn primary" type="submit">Save</button>
      <a class="btn" href="/red-thread">Cancel</a>
    </p>
  </form>
  <script>
  document.getElementById('editform').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const content = document.querySelector('textarea[name=content]').value;
    const res = await fetch('/red-thread/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'content=' + encodeURIComponent(content),
    });
    if (res.ok) { location.href = '/red-thread'; }
    else { alert('Save failed: ' + res.status); }
  });
  </script>`;
  return page('Red Thread · Edit', body);
}

// ------------------------------------------------------------- multipart

function parseMultipart(buffer, contentType) {
  const m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!m) return null;
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim());
  const parts = [];
  let start = buffer.indexOf(boundary);
  while (start !== -1) {
    start += boundary.length;
    if (buffer.slice(start, start + 2).toString() === '--') break;
    if (buffer.slice(start, start + 2).toString() === '\r\n') start += 2;
    const headerEnd = buffer.indexOf('\r\n\r\n', start);
    if (headerEnd === -1) break;
    const headers = buffer.slice(start, headerEnd).toString('utf8');
    const next = buffer.indexOf(boundary, headerEnd + 4);
    if (next === -1) break;
    let bodyEnd = next;
    if (buffer.slice(bodyEnd - 2, bodyEnd).toString() === '\r\n') bodyEnd -= 2;
    const body = buffer.slice(headerEnd + 4, bodyEnd);
    const nameM = headers.match(/name="([^"]*)"/);
    const fileM = headers.match(/filename="([^"]*)"/);
    const typeM = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    parts.push({
      name: nameM ? nameM[1] : null,
      filename: fileM ? fileM[1] : null,
      contentType: typeM ? typeM[1].trim() : null,
      body,
    });
    start = next;
  }
  return parts;
}

const IMAGE_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/heic': '.heic', 'image/webp': '.webp', 'image/gif': '.gif' };
const EXT_MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.heic': 'image/heic', '.webp': 'image/webp', '.gif': 'image/gif' };

// --------------------------------------------------------------- helpers

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 50 * 1024 * 1024) { req.destroy(); reject(new Error('body too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

// ----------------------------------------------------------------- server

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/\/+$/, '') || '/';

  try {
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(302, { Location: '/red-thread' });
      res.end();
      return;
    }
    if (req.method === 'GET' && p === '/red-thread') {
      send(res, 200, 'text/html; charset=utf-8', viewPage());
      return;
    }
    if (req.method === 'GET' && p === '/red-thread/edit') {
      send(res, 200, 'text/html; charset=utf-8', editPage());
      return;
    }
    if (req.method === 'GET' && p === '/red-thread/raw') {
      send(res, 200, 'text/plain; charset=utf-8', fs.readFileSync(BIBLE_FILE, 'utf8'));
      return;
    }
    if (req.method === 'GET' && (p === '/red-thread/health' || p === '/health')) {
      send(res, 200, 'application/json', JSON.stringify({ ok: true, app: 'red-thread' }));
      return;
    }
    if (req.method === 'POST' && p === '/red-thread/save') {
      const buf = await readBody(req);
      const ctype = req.headers['content-type'] || '';
      let content = null;
      if (ctype.includes('application/x-www-form-urlencoded')) {
        content = new URLSearchParams(buf.toString('utf8')).get('content');
      } else if (ctype.includes('multipart/form-data')) {
        const part = (parseMultipart(buf, ctype) || []).find((x) => x.name === 'content');
        content = part ? part.body.toString('utf8') : null;
      } else {
        content = buf.toString('utf8'); // raw text body
      }
      if (content == null || content.trim() === '') {
        send(res, 400, 'application/json', JSON.stringify({ ok: false, error: 'empty content' }));
        return;
      }
      const when = saveBible(content);
      send(res, 200, 'application/json', JSON.stringify({ ok: true, savedAt: when.toISOString() }));
      return;
    }
    if (req.method === 'POST' && p === '/red-thread/sketchbook/upload') {
      const ctype = req.headers['content-type'] || '';
      if (!ctype.includes('multipart/form-data')) {
        send(res, 400, 'text/plain', 'multipart/form-data required');
        return;
      }
      const buf = await readBody(req);
      const parts = parseMultipart(buf, ctype) || [];
      const field = (n) => { const x = parts.find((q) => q.name === n && !q.filename); return x ? x.body.toString('utf8').trim() : ''; };
      const photo = parts.find((q) => q.name === 'photo' && q.filename);
      const rt = field('rt');
      const caption = field('caption');
      if (!photo || !photo.body.length || !rt) {
        send(res, 400, 'text/plain', 'photo and rt are required');
        return;
      }
      const origExt = path.extname(photo.filename || '').toLowerCase();
      const ext = EXT_MIME[origExt] ? origExt : (IMAGE_EXT[photo.contentType] || '.jpg');
      const safeRt = rt.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'RT';
      const file = `${timestamp()}-${safeRt}-${crypto.randomBytes(3).toString('hex')}${ext}`;
      fs.writeFileSync(path.join(SKETCH_DIR, file), photo.body);
      const entries = readSketchIndex();
      entries.push({ rt, caption, file, uploadedAt: new Date().toISOString() });
      writeSketchIndex(entries);
      const wantsJson = (req.headers.accept || '').includes('application/json');
      if (wantsJson) {
        send(res, 200, 'application/json', JSON.stringify({ ok: true, file, rt }));
      } else {
        res.writeHead(302, { Location: '/red-thread' });
        res.end();
      }
      return;
    }
    if (req.method === 'GET' && p.startsWith('/red-thread/sketchbook/img/')) {
      const name = path.basename(decodeURIComponent(p.slice('/red-thread/sketchbook/img/'.length)));
      const file = path.join(SKETCH_DIR, name);
      if (!fs.existsSync(file) || path.dirname(file) !== SKETCH_DIR) {
        send(res, 404, 'text/plain', 'not found');
        return;
      }
      const mime = EXT_MIME[path.extname(name).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' });
      fs.createReadStream(file).pipe(res);
      return;
    }
    send(res, 404, 'text/plain', 'not found');
  } catch (err) {
    console.error(err);
    send(res, 500, 'text/plain', 'internal error');
  }
});

ensureStorage();
server.listen(PORT, () => {
  console.log(`Red Thread listening on http://0.0.0.0:${PORT}/red-thread`);
  console.log(`Data directory: ${DATA_DIR}`);
});
