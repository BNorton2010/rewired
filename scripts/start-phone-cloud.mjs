import { spawn } from 'node:child_process';
import path from 'node:path';

// Physical iPhone Expo Go requires the same personal account on both ends.
// Keep the existing EAS automation token separate; never write either to disk.
const personalToken = process.env.EXPO_GO_TOKEN;
if (!personalToken) {
  console.error('Add EXPO_GO_TOKEN securely in cloud environment settings, using a personal token from the account signed into Expo Go on your iPhone.');
  process.exit(1);
}

const child = spawn(process.execPath, [path.resolve('node_modules/expo/bin/cli'), 'start', '--go', '--tunnel', '--port', '8083', '--max-workers', '2'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_TOKEN: personalToken,
    EXPO_OFFLINE: '0',
    EXPO_NO_INSPECTOR_PROXY: '1',
    BROWSER: 'none',
    XDG_CACHE_HOME: path.resolve('.cache'),
    __UNSAFE_EXPO_HOME_DIRECTORY: path.resolve('.cache/expo-home'),
  },
});
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
