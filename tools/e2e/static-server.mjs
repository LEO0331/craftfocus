import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../dist');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.ttf': 'font/ttf',
};

function resolvePath(requestPath) {
  const clean = (requestPath || '/').split('?')[0];
  const rel = clean.replace(/^\/+/, '');
  const candidate = path.join(root, rel);
  const hasFileExtension = path.extname(rel).length > 0;

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return { filePath: candidate, status: 200 };
  }

  const indexInDir = path.join(root, rel, 'index.html');
  if (fs.existsSync(indexInDir)) {
    return { filePath: indexInDir, status: 200 };
  }

  if (hasFileExtension) {
    return { filePath: null, status: 404 };
  }

  return { filePath: path.join(root, 'index.html'), status: 200 };
}

const server = http.createServer((req, res) => {
  const { filePath, status } = resolvePath(req.url || '/');

  if (!filePath) {
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(status, { 'content-type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}`);
});
