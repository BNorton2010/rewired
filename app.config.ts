import type { ConfigContext, ExpoConfig } from 'expo/config';

// The native app and local preview stay at their ordinary root. GitHub Pages
// builds supply /rewired so router links and audio assets use the hosted subpath.
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.REWIRED_WEB_BASE_PATH;
  if (baseUrl && !/^\/[A-Za-z0-9_-]+$/.test(baseUrl)) throw new Error('REWIRED_WEB_BASE_PATH must be a single path such as /rewired');
  return {
    ...config,
    name: config.name ?? 'Re-Wired FM',
    slug: config.slug ?? 'rewired-fm',
    web: { ...config.web, favicon: './assets/artwork/optimized/favicon.png' },
    ...(baseUrl ? { experiments: { ...config.experiments, baseUrl } } : {}),
  };
};
