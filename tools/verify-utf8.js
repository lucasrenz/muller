import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const root = process.cwd();
const decoder = new TextDecoder('utf-8', { fatal: true });

const ignoredDirectories = new Set([
  '.git',
  'dist',
  'node_modules',
]);

const textExtensions = new Set([
  '.cjs',
  '.conf',
  '.css',
  '.env',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ps1',
  '.py',
  '.sql',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
]);

const textFileNames = new Set([
  '.env',
  '.gitignore',
  '.htaccess',
  '.nvmrc',
  '.version',
  'Dockerfile',
]);

const invalidFiles = [];

function shouldCheckFile(filePath) {
  const fileName = path.basename(filePath);
  return textFileNames.has(fileName) || textExtensions.has(path.extname(fileName));
}

async function checkDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await checkDirectory(entryPath);
      }
      continue;
    }

    if (!entry.isFile() || !shouldCheckFile(entryPath)) {
      continue;
    }

    try {
      decoder.decode(await readFile(entryPath));
    } catch {
      invalidFiles.push(path.relative(root, entryPath));
    }
  }
}

await checkDirectory(root);

if (invalidFiles.length > 0) {
  console.error('Invalid UTF-8 files found:');
  for (const file of invalidFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('All checked text files are valid UTF-8.');
