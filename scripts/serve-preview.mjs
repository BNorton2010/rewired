import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.env.REWIRED_PREVIEW_DIR || 'dist');
const port = Number(process.env.REWIRED_PREVIEW_PORT || 8081);
const basePath = (process.env.REWIRED_PREVIEW_BASE_PATH || '').replace(/\/$/, '');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Web export is missing. Run npm run build:web first.');
  process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  if (basePath) {
    if (pathname === basePath) { response.writeHead(302, { Location: `${basePath}/` }); response.end(); return; }
    if (!pathname.startsWith(`${basePath}/`)) { response.writeHead(404); response.end(); return; }
    pathname = pathname.slice(basePath.length);
  }
  let file = path.resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) { response.writeHead(403); response.end(); return; }
  let stat;
  try { stat = fs.statSync(file); } catch { /* Router paths use the single-page entry below. */ }
  if (stat?.isDirectory()) {
    file = path.join(file, 'index.html');
    try { stat = fs.statSync(file); } catch { stat = undefined; }
  }
  if (!stat?.isFile()) {
    if (path.extname(pathname)) { response.writeHead(404); response.end(); return; }
    file = path.join(root, 'index.html'); stat = fs.statSync(file);
  }
  const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  let start = 0, end = stat.size - 1, status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return; }
    if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
    else start = Math.max(0, stat.size - Number(match[2]));
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return; }
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  response.writeHead(status, headers);
  if (request.method === 'HEAD') { response.end(); return; }
  const stream = fs.createReadStream(file, { start, end });
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
});
server.on('error', error => { console.error(`Could not start the preview: ${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Re-Wired FM browser preview: http://localhost:${port}${basePath}/\nKeep this terminal open. Press Ctrl+C to stop.`));
