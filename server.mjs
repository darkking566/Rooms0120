// Zero-dependency static server for local play and tests: `npm start` → http://localhost:8080
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export function createServer() {
  return http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    const rel = path.relative(root, file);
    if (rel.startsWith('..') || rel.split(path.sep).some((s) => s.startsWith('.') || s === 'node_modules')) {
      res.writeHead(404); return res.end('not found');
    }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(data);
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  createServer().listen(port, () => console.log(`ROOMS0120 → http://localhost:${port}`));
}
