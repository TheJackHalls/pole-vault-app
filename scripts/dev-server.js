const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 5173;
const rootDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const serveFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
};

const server = http.createServer((req, res) => {
  const requestUrl = req.url ? req.url.split('?')[0] : '/';
  const safePath = requestUrl === '/' ? '/index.html' : requestUrl;
  const filePath = path.join(rootDir, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(filePath, res);
      return;
    }

    serveFile(path.join(rootDir, 'index.html'), res);
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Dev server running at http://localhost:${port}`);
});
