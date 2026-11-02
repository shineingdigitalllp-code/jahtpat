const path = require('node:path');
const { spawnSync } = require('node:child_process');

const target = process.env.APP_TARGET || 'web';
if (!['web', 'admin', 'api'].includes(target)) throw new Error('Invalid APP_TARGET');
const cwd = path.resolve(__dirname, '../apps', target);

function run(modulePath, args, env = process.env) {
  const entry = require.resolve(modulePath, { paths: [cwd] });
  const result = spawnSync(process.execPath, [entry, ...args], { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

if (target === 'api') {
  run('prisma/build/index.js', ['generate'], {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'mysql://localhost:3306/jhatpat',
  });
  run('tsup/dist/cli-default.js', []);
} else {
  run('next/dist/bin/next', ['build', '--webpack']);
}
