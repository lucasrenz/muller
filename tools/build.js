import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

const generateStatus = run(process.execPath, [path.join(root, 'tools', 'generate-llms.js')]);

if (generateStatus !== 0) {
  console.warn('LLMS documentation generation failed; continuing with Vite build.');
}

const viteStatus = run(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  'build',
]);

process.exit(viteStatus);
