/**
 * Hiora Admin — dependency-free Cloudflare Pages asset build.
 * The deployment directory is intentionally allowlisted: SQL migrations, source
 * tests, repository metadata and other local files must never be public.
 */
import { cp, copyFile, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const publishDir = path.join(projectRoot, 'dist');
const rootFiles = ['index.html', 'config.js', '_headers', '_redirects'];
const requiredAssets = ['app.js', 'supabase.js', 'demo.js', 'styles.css', 'favicon.svg'];

await rm(publishDir, { recursive: true, force: true });
await mkdir(publishDir, { recursive: true });
for (const name of rootFiles) {
  await copyFile(path.join(projectRoot, name), path.join(publishDir, name));
}
const assetsSource = path.join(projectRoot, 'assets');
for (const asset of requiredAssets) {
  const found = await stat(path.join(assetsSource, asset));
  if (!found.isFile()) throw new Error('Missing required asset: ' + asset);
}
await cp(assetsSource, path.join(publishDir, 'assets'), { recursive: true });

const html = await readFile(path.join(publishDir, 'index.html'), 'utf8');
if (!html.includes('assets/app.js') || !html.includes('config.js')) {
  throw new Error('Built index.html is missing expected application entrypoints.');
}
const builtFiles = (await readdir(publishDir)).sort();
if (builtFiles.some(f => f === 'supabase' || f === 'scripts' || f === 'tests')) {
  throw new Error('Private repository files found in Cloudflare publish directory.');
}
console.log('Hiora Admin Pages build complete: ' + builtFiles.join(', ') + ' (output: dist/)');
