import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lessons } from '../src/content/catalog';

const basePath = '/rewired';
const destination = path.resolve('dist-pages');
const result = spawnSync(process.execPath, [path.resolve('node_modules/expo/bin/cli'), 'export', '--platform', 'web', '--output-dir', destination, '--max-workers', '2'], {
  stdio: 'inherit',
  env: { ...process.env, REWIRED_WEB_BASE_PATH: basePath, EXPO_OFFLINE: '1', __UNSAFE_EXPO_HOME_DIRECTORY: path.resolve('.cache/expo-home'), XDG_CACHE_HOME: path.resolve('.cache') },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(path.join(destination, '.nojekyll'), '');
copyFileSync(path.join(destination, 'index.html'), path.join(destination, '404.html'));
// Pages has no SPA rewrite rule. Give every real route a browser entry so direct
// links and reloads succeed. The shared client still chooses content and state.
const routes = ['onboarding', 'library', 'path', 'player', ...lessons.map(lesson => `lesson/${lesson.id}`)];
for (const route of routes) {
  const folder = path.join(destination, route);
  mkdirSync(folder, { recursive: true });
  copyFileSync(path.join(destination, 'index.html'), path.join(folder, 'index.html'));
}
console.log(`GitHub Pages build prepared at ${destination}, base path ${basePath}.`);
