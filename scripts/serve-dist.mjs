import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve(process.cwd(), 'dist');
const defaultPort = 4173;
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function getPort() {
  const portIndex = process.argv.indexOf('--port');
  if (portIndex >= 0) {
    const value = Number.parseInt(process.argv[portIndex + 1], 10);
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return defaultPort;
}

async function resolveFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const relativePath = normalizedPath.replace(/^\/+/, '');
  let absolutePath = path.resolve(rootDir, relativePath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  try {
    const stat = await fs.stat(absolutePath);
    if (stat.isDirectory()) {
      absolutePath = path.join(absolutePath, 'index.html');
    }
    return absolutePath;
  } catch {
    if (!path.extname(absolutePath)) {
      return path.join(rootDir, 'index.html');
    }
    return absolutePath;
  }
}

const server = http.createServer(async (request, response) => {
  const filePath = await resolveFilePath(request.url ?? '/');
  if (!filePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes.get(ext) ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

const port = getPort();

server.listen(port, '127.0.0.1', () => {
  console.log(`motion-book server: http://127.0.0.1:${port}/`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
