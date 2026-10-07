# Re-Wired FM

An iOS-first React Native audio app for creators and entrepreneurs, with Android support and a responsive web preview. Built with **Expo SDK 57**, **React Native 0.86**, **React 19**, TypeScript, and Expo Router. This first version is a clearly labeled **local demo**: no app accounts, payments, paid services, or production backend. A publicly hosted browser build still keeps listening data locally in each visitor's browser.

## Run the web preview

Use Node 24 LTS and npm. From the project folder:

```sh
cd /workspace/rewired
npm ci
npm run web:cloud
```

Open **http://localhost:8081** in a browser that can reach this cloud machine, or use your workspace's preview for port **8081** if provided. `localhost` on your own computer refers to that computer, not the cloud machine. The development server stays running until stopped with Ctrl+C and supports Fast Refresh. The cloud script uses Expo's offline mode to avoid blocked optional Expo APIs; npm installation still downloads verified packages from the registry. It keeps tool caches under `.cache/`.

On your own computer, from a copy of this folder:

```sh
npm ci
npm run web
```

The web app uses React Native Web components and the browser's audio API. There is no WebView. Audio must start from a user tap; background playback depends on the browser, tab suspension, and device power policies. Native lock-screen behavior is not validated by a browser preview.

### Run a built preview on your own computer

With Node 24 LTS installed, the exported browser-preview ZIP can run without npm installation. Unzip it, open a terminal in `rewired-fm-browser-preview`, run `node scripts/serve-preview.mjs`, and open `http://localhost:8081`. Keep the terminal open while testing. This server binds to your own computer only, supports audio range requests and route reloads, and uses the bundled samples. Progress is saved in that browser's local storage.

To create and serve a new preview from the full source project, run `npm run build:web`, then `npm run preview`. The live cloud development server and this built preview are separate processes; stop the existing server before reusing port 8081, or use `REWIRED_PREVIEW_PORT=8082 npm run preview` on macOS/Linux.

## Publish a public browser preview

The source repository is `BNorton2010/rewired`. GitHub Pages can serve a free public browser preview from its `gh-pages` branch. Build and publish commands:

```sh
npm run build:pages
node scripts/publish-pages.mjs
```

Or run `npm run deploy:pages` to do both. Publishing requires authorized Git write access. Set GitHub repository Settings → Pages → Deploy from a branch → `gh-pages` → `/ (root)` and save. The expected site address is `https://bnorton2010.github.io/rewired/`; the address is only live after GitHub confirms a successful Pages deployment. Repository visibility and account plan must permit Pages. The publishing script does not change repository visibility.

`app.config.ts` supplies Expo's documented `/rewired` base URL only to the Pages build; local previews and native builds keep the normal root. The Pages build includes `.nojekyll`, a fallback, and entry files for each app route so audio assets, direct links, and reloads work. It publishes generated files using an isolated Git index without changing the source branch, creating a Git worktree, or forcing remote history. Future deployments retain the previous Pages commit as their parent.

An Expo project ID is configured in `app.json`: `f824a207-b43d-4e95-9e57-f38e4a693d80`. The ID is public metadata. Validate access and link the project after signing into the correct Expo account:

```sh
npx eas-cli@latest whoami
npx eas-cli@latest init --id f824a207-b43d-4e95-9e57-f38e4a693d80 --non-interactive
```

EAS Hosting is an alternative that supports a free account. Export a root-path web build with `npm run build:web` and publish it with `npx eas-cli@latest deploy`. Do not send `dist-pages` to EAS Hosting, since that build is specifically for GitHub's `/rewired` subpath. EAS requires Expo authentication and a chosen or existing hosting subdomain. In the cloud, supply `EXPO_TOKEN` securely in environment settings; never commit a token or paste it into chat. Configuring the project ID locally is not proof that remote initialization or deployment has succeeded.

## Test on your iPhone

### Fast UI and foreground-audio check with Expo Go

Copy or download this project onto a computer on the same Wi-Fi as your iPhone. Install Expo Go from the App Store; its current version must support **SDK 57**. In the local project folder:

```sh
npm ci
npx expo start --go --host lan
```

Scan the QR code with the iPhone Camera app and open it in Expo Go. Test onboarding, the library, foreground audio controls, and saved data. `--go` is explicit because this project also includes `expo-dev-client`. The cloud machine's private LAN QR address generally will not be reachable from your iPhone. Use the local-computer instructions above instead of scanning that cloud address. Web preview in iPhone Safari is useful for responsive layout, but is not a native-app test.

### Native background audio and lock-screen controls

Use a **development build** to test this app's own native configuration. On a **Mac** with current Xcode, command-line tools, CocoaPods, and a connected iPhone with Developer Mode enabled:

```sh
npm ci
npx expo run:ios --device
```

Select your device and a development signing team. A free Apple personal team can be used for local device testing, subject to Apple's provisioning limits and expiry; no paid hosting or build service is required. If signing needs attention, open the generated workspace with `open ios/*.xcworkspace`, choose the app target → Signing & Capabilities → your personal team in Xcode, then build to your device. A personal-team build may need reinstallation when its provisioning expires.

After the initial native build, start or reconnect the Metro server with:

```sh
npx expo start --dev-client --host lan
```

Open the installed Re-Wired FM development app and connect to this server. Rebuild with `npx expo run:ios --device` after changing config plugins, native dependencies, or background capabilities. JavaScript and content changes use Fast Refresh. The cloud environment is Linux and cannot compile or sign an iPhone app locally.

| Feature | Expo Go / web | App development build |
| --- | --- | --- |
| Screens, onboarding, search, favorites, path | Expo Go and web can test | Works; validate native layout too |
| Play/pause, seek, ±15 seconds, playback speed | Foreground controls can be tested | Native Expo Audio transport |
| Saved preferences and positions | Local to each browser/install | Local to this app install |
| This app's iOS background-audio capability | Expo Go does not apply this app's config plugin; web follows browser rules | **Required** to validate screen-lock and background behavior |
| Native lock-screen / Control Center controls | Browser support varies; no guarantee | **Required** to validate controls and metadata |
| Android sustained background playback / media service | Expo Go does not apply this app's manifest | **Required**; test with `npx expo run:android --device` on an Android development machine |

Device checklist: listen with the screen locked and app backgrounded; try lock-screen play/pause, seeking, and metadata; make or receive a call; unplug headphones and disconnect Bluetooth; manually resume; finish a session; kill/reopen the app and check the paused restored position; try large Dynamic Type, VoiceOver, Reduce Motion, and Android TalkBack. Confirm Android background audio lasts beyond three minutes. The app does not request microphone permissions.

## What is included

- Goal and session-length onboarding; preferences can be edited later.
- Today recommendations based on selected goals, duration, and previously practiced lessons; two quick resets.
- Eight illustrative practices, searchable and filterable by six topics and favorites.
- A 14-day journey with local progress. Listening to the end marks the lesson practiced and completes the next matching path day; a circle lets you self-report another practiced day. There are no psychological scores, locked days, promised outcomes, or streak penalties.
- A single persistent player across the main screens, with play/pause, actual duration, seeking, ±15-second controls, speed, errors/retry, completion, and saved listening position. Restored sessions begin paused.
- Native Expo Audio session uses `playsInSilentMode`, `shouldPlayInBackground`, and `doNotMix`. `expo-audio`'s config plugin enables the iOS audio background mode and Android media playback service. Lock-screen controls are registered with title and demo metadata. Native OS interruptions and headset disconnection can pause playback; users choose when to resume.
- Responsive safe-area layouts, readable off-white text, gold controls, and original static cosmic vector art. Static art and disabled navigation animations respect reduced motion. System fonts retain platform text scaling; native accessibility still requires device testing.

## Content and licensing

All visible lessons are **illustrative demo content**. The bundled 3-, 5-, and 9-minute files are original **instrumental ambient samples**, not final narrated practices. Reading companions are explicitly labeled as reflective text, not transcripts of a voice recording. There is no audio-generation feature in the app.

The audio files and synthesis recipe are CC0; see [the audio license](assets/audio/LICENSE.md). Artwork is original vector art in this repository. There are no third-party stock recordings. Optional sample rebuilding uses the checked-in Python recipe and ffmpeg; the app does not need those tools to run.

To replace content:

1. Edit lesson titles, topics, descriptions, lengths, intentions, and reading text in `src/content/catalog.ts`.
2. Replace the static audio mappings in `src/audio/sources.ts`. Each lesson currently shares the sample for its duration; final recordings should be keyed by lesson ID. Audio displays its actual loaded duration, not an invented final-recording duration.
3. Replace `src/ui/CosmicArt.tsx` or add licensed bundled images. Keep artwork descriptions decorative unless they convey information.
4. Preserve lesson IDs to retain local favorites and progress. A changing data schema needs an explicit migration; unknown versions are preserved and surfaced as a storage warning.

## Project structure and future connections

```text
app/                        Expo Router screens and navigation
  (tabs)/                   Today, Library, My Path + persistent mini-player
  lesson/[id].tsx            Reading companion and lesson detail
  player.tsx                Full player controls
  onboarding.tsx            Initial and editable preferences
src/audio/                  Platform transports and replaceable audio sources
  AudioProvider.tsx         Native Expo Audio session, interruptions and lock screen
  AudioProvider.web.tsx     Browser HTMLAudioElement with explicit play/error handling
src/content/                Catalog, recommendation, search, and path logic
src/persistence/            AsyncStorage, versioned local state, ordered writes
src/integrations/demo.ts    Explicit future account/entitlement boundary
src/ui/                     Shared controls, artwork, theme, mini-player
assets/audio/               Bundled CC0 audio samples and provenance
scripts/                    Cloud launcher, native-config check, audio recipe
tests/                      Content/state tests and Playwright browser flows
```

Screens consume audio and persistence through hooks and do not manage player instances or storage directly. Authentication can enter at the root provider boundary in `app/_layout.tsx`, with local preferences retained and an explicit migration/merge policy. Hosted content should replace the catalog/audio-source boundaries with versioned metadata, authorized HTTPS URLs, caching, and expiry handling. Raw authentication tokens should use secure device storage rather than this demo's AsyncStorage.

The intended model is a **one-time lifetime purchase**. In a later milestone, replace the demo-access boundary with platform purchase APIs and independently verified receipts/entitlements, restoration, refund handling, and an agreed account policy. Local storage and `hasCatalogAccess` in `demo.ts` must never be treated as proof of purchase. This milestone intentionally contains no live checkout or purchase simulation.

## Validation

```sh
npm run typecheck
npm test
npm run check:native-config
npm run build:web
# With the web development server already running:
npm run test:browser
```

Playwright uses `/usr/bin/chromium` when available in this cloud machine. On another computer, run `npx playwright install chromium` first. `TEST_BASE_URL` can point the tests at another local port. Browser tests cover real time advancement, play/pause, seeking, skipping, speed changes, persistence across reloads, favorites, progress, filters, empty states, mobile layout, and reduced motion. `expo export --platform all --max-workers 2` additionally bundles iOS, Android, and web JavaScript; it is not a native binary build.

Native config introspection verifies the background mode, media service, and absence of microphone permissions. Actual iOS/Android binaries, hardware interruption behavior, OS background lifetimes, native assistive technologies, and lock-screen controls require the device checklist above. No remote deployment or GitHub upload is performed by these commands.

Current cloud validation: a clean `npm ci` succeeded; TypeScript passed; all **7 content/state tests** and **3 browser tests** passed; web, iOS, and Android JavaScript bundles exported; native audio configuration assertions passed. Chromium inspection covered desktop and a 320-pixel mobile viewport, with no horizontal overflow. The mobile browser test simulated 1.4× text and reduced motion. The web server returned HTTP 200 and was left running for iteration. No physical-device or signed native-binary testing was performed. This session has no tool for opening a user-facing built-in browser panel; the preview was inspected with automated Chromium instead.

The cloud Expo CLI may report an optional React Native DevTools launch failure because its desktop sandbox helper cannot run here. The Metro server and web preview still run; use browser developer tools for the preview and native developer tools on your local development machine.

Official guidance consulted: [Expo Router installation](https://docs.expo.dev/router/installation/), [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), and [development builds](https://docs.expo.dev/develop/development-builds/introduction/), using their official `expo/expo` documentation source when this environment blocked the documentation site. Native versions were selected from SDK 57's bundled compatibility manifest and checked with `expo install --check`.

Next steps: replace sample recordings and validate content; run native device checks; refine accessibility with users; then design purchase verification and hosted-content delivery as separate milestones.
