import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('.');
const port = Number(process.env.PORT || 4173);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function resolvePath(url) {
  const cleanUrl = decodeURIComponent(url.split('?')[0]);
  const routeMap = {
    '/': '/public/index.html',
    '/admin': '/public/admin.html',
  };
  const requested = normalize(routeMap[cleanUrl] || cleanUrl);
  let filePath = resolve(join(root, requested));
  if (!existsSync(filePath) && !requested.startsWith('/public/') && extname(requested)) {
    filePath = resolve(join(root, 'public', requested));
  }
  if (!filePath.startsWith(root)) return null;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    return join(filePath, 'index.html');
  }
  return filePath;
}

createServer((request, response) => {
  const cleanUrl = decodeURIComponent((request.url || '/').split('?')[0]);
  const redirects = {
    '/index.html': '/',
    '/public/index.html': '/',
    '/admin.html': '/admin',
    '/public/admin.html': '/admin',
  };

  if (redirects[cleanUrl]) {
    response.writeHead(308, {
      location: redirects[cleanUrl],
      'cache-control': 'no-store',
    });
    response.end();
    return;
  }

  const filePath = resolvePath(request.url || '/');
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': types[extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Onikara dev server: http://127.0.0.1:${port}/`);
});
