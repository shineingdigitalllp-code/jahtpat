const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');

// Hostinger expects the entry file's own process to call listen(), so each app runs in-process.
const target = process.env.APP_TARGET || 'web';
if (!['web', 'admin', 'api'].includes(target)) throw new Error('Invalid APP_TARGET');
const cwd = path.resolve(__dirname, '../apps', target);
process.chdir(cwd);
process.env.NODE_ENV = 'production';

function fail(error) {
  console.error(error);
  process.exit(1);
}

if (target === 'api') {
  import(pathToFileURL(path.join(cwd, 'dist/server.js')).href).catch(fail);
} else {
  const next = require(require.resolve('next', { paths: [cwd] }));
  const app = next({ dev: false, dir: cwd });
  const ready = app.prepare().then(() => app.getRequestHandler());
  ready.catch(fail);
  // Listen immediately; requests wait until Next.js has finished preparing.
  http
    .createServer((req, res) => ready.then((handle) => handle(req, res)).catch(fail))
    .listen(Number(process.env.PORT) || 3000);
}
