import { spawn } from 'node:child_process';
import path from 'node:path';
// Keep development caches in the writable project on cloud machines.
const child = spawn(process.execPath, [path.resolve('node_modules/expo/bin/cli'), 'start', '--web', '--host', 'lan', '--port', '8081', '--max-workers', '2'], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_OFFLINE: '1', EXPO_NO_INSPECTOR_PROXY: '1', BROWSER: 'none', XDG_CACHE_HOME: path.resolve('.cache'), __UNSAFE_EXPO_HOME_DIRECTORY: path.resolve('.cache/expo-home') },
});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
