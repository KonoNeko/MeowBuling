import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createApi } from './api';

const root = path.resolve('dist');
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.png': 'image/png' };
const api = createApi();
createServer((req, res) => {
  void api(req, res, () => { void (async () => {
    try {
      const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      let file = path.resolve(root, `.${pathname}`);
      if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
      if (pathname === '/') file = path.join(root, 'index.html');
      if (!(await stat(file)).isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(404).end('请先运行 npm run build。'); }
  })(); });
}).listen(Number(process.env.PORT || 5173), '127.0.0.1', () => console.log(`喵卜灵本地服务：http://127.0.0.1:${process.env.PORT || 5173}`));
