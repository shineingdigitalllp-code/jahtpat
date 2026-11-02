const path = require('node:path');
const { spawn } = require('node:child_process');

const target = process.env.APP_TARGET || 'web';
if (!['web', 'admin', 'api'].includes(target)) throw new Error('Invalid APP_TARGET');
const cwd = path.resolve(__dirname, '../apps', target);
const entry = target === 'api'
  ? path.join(cwd, 'dist/server.js')
  : require.resolve('next/dist/bin/next', { paths: [cwd] });
const args = target === 'api' ? [] : ['start', '-H', '0.0.0.0', '-p', String(process.env.PORT || 3000)];
const child = spawn(process.execPath, [entry, ...args], {
  cwd,
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit',
});
child.on('error', (error) => { console.error(error); process.exit(1); });
child.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
