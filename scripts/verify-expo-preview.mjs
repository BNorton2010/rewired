import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Run on Expo's worker when this workspace cannot reach its asset CDN.
// Uses public update files, requires no account token, and preserves TLS checks.
const config = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8')).expo;
const updates = JSON.parse(process.env.REWIRED_PREVIEW_UPDATES_JSON || '[]');
const id = process.env.REWIRED_PREVIEW_UPDATE_ID;
const update = updates.find((item) => item.platform === 'ios') || (id && {
  id, platform: 'ios', runtimeVersion: config.version,
  manifestPermalink: `https://u.expo.dev/update/${id}`,
});
assert(update, 'Provide a published iOS update ID or the publish job output.');
const url = new URL(update.manifestPermalink);
assert.equal(url.origin, 'https://u.expo.dev');
assert.equal(url.pathname, `/update/${update.id}`);
// Match Expo Updates' native download headers. Use one fixed verification-client
// identifier so repeated CI checks do not count as new devices.
const downloadHeaders = {
  'Expo-Platform': 'ios',
  'Expo-Protocol-Version': '1',
  'Expo-API-Version': '1',
  'Expo-Updates-Environment': 'BARE',
  'Expo-Runtime-Version': update.runtimeVersion,
  'EAS-Client-ID': 'b4f25cb0-28ac-478b-904d-2159d8c37371',
};

const response = await fetch(url, {
  signal: AbortSignal.timeout(30_000),
  headers: {
    ...downloadHeaders,
    Accept: 'multipart/mixed,application/expo+json,application/json',
  },
});
assert.equal(response.status, 200, 'Published iOS manifest must be downloadable.');
const contentType = response.headers.get('content-type') || '';
const text = await response.text();
const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
const bodies = boundary
  ? text.split(`--${boundary[1] || boundary[2]}`).flatMap((part) => {
      const offset = part.indexOf('\r\n\r\n');
      return offset < 0 ? [] : [part.slice(offset + 4).trim()];
    })
  : [text];
const parts = bodies.flatMap((body) => {
  try { return [JSON.parse(body)]; } catch { return []; }
});
const manifest = parts.find((body) => body.id === update.id && body.launchAsset);
// Expo supplies short-lived, per-asset authorization in a separate multipart
// extension. Forward it only to Expo's validated CDN, never log or persist it.
const assetRequestHeaders = parts.find((body) => body.assetRequestHeaders)?.assetRequestHeaders;
assert(assetRequestHeaders, 'The manifest must include asset download authorization.');
assert(manifest, 'A valid manifest was not returned.');
assert.equal(manifest.runtimeVersion, update.runtimeVersion);
assert.equal(manifest.extra.eas.projectId, config.extra.eas.projectId);
assert.equal(manifest.extra.expoClient.name, config.name);
assert.equal(manifest.extra.expoClient.sdkVersion, '57.0.0');
const audio = manifest.assets.filter((asset) => asset.contentType === 'audio/mpeg');
assert.equal(audio.length, 3, 'All three illustrative audio samples must be published.');

const assets = [manifest.launchAsset, ...manifest.assets];
let bytes = 0;
for (let offset = 0; offset < assets.length; offset += 4) {
  await Promise.all(assets.slice(offset, offset + 4).map(async (asset) => {
    const assetUrl = new URL(asset.url);
    assert.equal(assetUrl.origin, 'https://assets.eascdn.net');
    const downloaded = await fetch(assetUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: { ...downloadHeaders, ...assetRequestHeaders[asset.key] },
    });
    if (downloaded.status !== 200) {
      const reason = (await downloaded.text()).replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
      throw new Error(`Published ${asset.contentType} asset returned ${downloaded.status}: ${reason}`);
    }
    const data = Buffer.from(await downloaded.arrayBuffer());
    assert(data.length > 0);
    assert.equal(createHash('sha256').update(data).digest('base64url'), asset.hash,
      'Downloaded asset must match its published SHA-256 hash.');
    if (asset === manifest.launchAsset) {
      assert(data.subarray(0, 8).equals(Buffer.from('c61fbc03c103191f', 'hex')),
        'The launch asset must be a Hermes bundle.');
    }
    bytes += data.length;
  }));
}
const goUrl = url.href.replace(/^https:/, 'exps:');
console.log(JSON.stringify({
  updateId: update.id,
  groupId: update.group,
  projectId: config.extra.eas.projectId,
  sdkVersion: manifest.extra.expoClient.sdkVersion,
  verifiedAssets: assets.length,
  verifiedAudioSamples: audio.length,
  verifiedBytes: bytes,
  expoGoUrl: goUrl,
  physicalDeviceTested: false,
}, null, 2));
