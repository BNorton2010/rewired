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

The source is published at [BNorton2010/rewired](https://github.com/BNorton2010/rewired). The public browser preview is live at **[bnorton2010.github.io/rewired](https://bnorton2010.github.io/rewired/)**, served for free by GitHub Pages from the `gh-pages` branch. Open that link on a computer or in iPhone Safari; no installation or Expo account is required for visitors. Progress stays in that browser. This is a published snapshot; changes appear after another deployment rather than through the cloud development server's Fast Refresh. Build and publish commands:

```sh
npm run build:pages
node scripts/publish-pages.mjs
```

Or run `npm run deploy:pages` to do both. Publishing requires authorized Git write access. Pages is configured under repository Settings → Pages → Deploy from a branch → `gh-pages` → `/ (root)`. On a new repository, enable that setting once. Repository visibility and account plan must permit Pages. The publishing script does not change repository visibility. The existing repository was already public.

`app.config.ts` supplies Expo's documented `/rewired` base URL only to the Pages build; local previews and native builds keep the normal root. The Pages build includes `.nojekyll`, a fallback, and entry files for each app route so audio assets, direct links, and reloads work. It publishes generated files using an isolated Git index without changing the source branch, creating a Git worktree, or forcing remote history. Future deployments retain the previous Pages commit as their parent.

An Expo project ID is configured in `app.json`: `f824a207-b43d-4e95-9e57-f38e4a693d80`. The ID is public metadata. The supplied project is named **`beau`** in the **`paid-to-bring-peace`** Expo account, so EAS initialization aligned the local Expo slug and owner with that existing project. The app's displayed name remains **Re-Wired FM**. Validate access and the connection after signing into the correct Expo account:

```sh
npx eas-cli@latest whoami
npx eas-cli@latest init --id f824a207-b43d-4e95-9e57-f38e4a693d80 --non-interactive
```

Expo token authentication, initialization, and `eas project:info` were verified against this exact project. No cloud native build, app-store submission, or EAS Hosting deployment has been started. The token is kept in cloud environment settings and is not part of the repository or the browser app.

EAS Hosting is an alternative that supports a free account. Export a root-path web build with `npm run build:web` and publish it with `npx eas-cli@latest deploy`. Do not send `dist-pages` to EAS Hosting, since that build is specifically for GitHub's `/rewired` subpath. EAS requires Expo authentication and a chosen or existing hosting subdomain. In the cloud, supply `EXPO_TOKEN` securely in environment settings; never commit a token or paste it into chat. Configuring the project ID locally is not proof that remote initialization or deployment has succeeded.

## Test on your iPhone

### Hosted iPhone preview with Expo and GitHub

This route is intended for someone using only an iPhone. Install the latest Expo Go from the App Store; it must support **SDK 57**. A published Expo preview lets the phone download the app from Expo without a running cloud tunnel. It tests native screens and audio. SDK 57 iOS Expo Go already includes the audio background mode, so screen-lock playback can be checked there; it does not install this app's own native configuration.

Open **[the iPhone preview page](https://bnorton2010.github.io/rewired/phone-preview/)** in Safari. Sign into Expo Go as **`bnorton2010`**, return to that page, and tap **Open in Expo Go** once to switch from the old pinned snapshot to the stable preview. After a new compatible update is published, use Expo Go's Reload; if it still shows a cached version, close and reopen that same preview online. Authenticated reload behavior needs a physical-phone check.

The stable URL is `exps://u.expo.dev/f824a207-b43d-4e95-9e57-f38e4a693d80?channel-name=rewired-go-preview&runtime-version=0.1.0&platform=ios`. The `rewired-go-preview` channel is linked to our existing branch of the same name. Its URL selects the latest compatible iOS update rather than pinning an update ID. Expo supports update selection through these [request query parameters](https://expo.fyi/eas-update-missing-headers); [channels link builds to update branches](https://docs.expo.dev/eas-update/how-it-works/). Each publication remains immutable, but the channel selects the newest one. A live development server is not needed.

`public/phone-preview/preview.json` records the stable URL, latest verified update ID, SDK, source commit and a pinned fallback URL. After publication, refresh its verification metadata and fallback link, and verify that the stable channel selects that update. Keep the main button and QR unchanged for compatible JavaScript/content updates. If the runtime changes, recheck compatibility and update the URL's runtime selector and QR together. This is published preview delivery, not Fast Refresh; changes still have to be published to Expo.

The connected Expo project can fetch this repository directly from GitHub. The manual-only workflow in `.eas/workflows/phone-preview.yml` publishes an iOS update to the isolated **`rewired-go-preview`** branch. It does not build an iOS binary, submit to the App Store, change existing production channels, or publish automatically on every commit. The account is on Expo's Free plan; no paid service or Apple Developer membership is required for this preview.

After committing and pushing an authorized change to GitHub, run:

```sh
npx eas-cli@latest workflow:run .eas/workflows/phone-preview.yml --ref HEAD --non-interactive
```

`--ref HEAD` asks Expo to fetch that exact GitHub commit rather than uploading this cloud workspace. Check the workflow's success and published update in [the Expo project](https://expo.dev/accounts/paid-to-bring-peace/projects/beau). Keep using the stable launch link and QR after verifying that the channel selects the new iOS update and all its assets are downloadable. A QR must point to the native Expo Go preview; the GitHub Pages link opens the browser app. On an iPhone alone, use a tappable preview link or Expo's Preview button, since the Camera app cannot scan a QR displayed on the same screen. Physical iPhone compatibility and audio still require a device check.

The workflow confirms that the stable channel resolves to the pinned update, downloads the published manifest and all 46 files, checks their SHA-256 hashes, confirms the SDK and presence of three audio samples, and validates the Hermes bundle. Expo provides temporary per-asset authorization in the manifest's multipart `extensions` part; the verifier forwards those headers only to Expo's CDN and never prints or stores them. Plain downloads without these headers can return 403 even for a valid update. To check an existing update without publishing another one:

```sh
npx eas-cli@latest workflow:run .eas/workflows/check-phone-preview.yml --ref HEAD \
  -F update_id=01a1144b-3d36-7591-8840-cf16262ee25e --non-interactive
```

Expo's Go-specific manifest requires sign-in with an account that belongs to `paid-to-bring-peace`; `bnorton2010` was verified as an owner. Do not embed an Expo token in the page, QR, app, or manifest URL. No visitor credential is sent to GitHub Pages. This cloud's personal token is scoped to Expo's API, so an authenticated Expo Go session still needs testing on the user's phone.

The configured `expo-updates` dependency and `updates.url` connect hosted updates to this project. The `appVersion` runtime policy is Expo Go compatible on supported SDKs. When changing native dependencies or capabilities for this app's own builds, bump `expo.version` and rebuild; do not send incompatible updates to an existing native runtime.

### Live cloud tunnel: diagnosed connection failure

Both cloud credentials were verified: **`EXPO_TOKEN`** is an automated Release Manager for EAS; **`EXPO_GO_TOKEN`** is the personal `bnorton2010` account for a live Expo Go development server. No additional token is needed. Never paste tokens into chat, source, or logs.

The optional launcher `npm run phone:cloud` uses the personal credential only for its process and starts port 8083 while the web server remains on 8081. However, the official ngrok helper failed to create a public tunnel here: initially it rejected a robot user; with the personal account it timed out or closed the tunnel session. Proxy diagnostics also showed blocked tunnel networking. Using ngrok's documented `root_cas: host` trusts the operating system's existing roots without disabling TLS, but the last attempt still ended with **session closed**. A valid local iOS manifest and bundle were served, proving local JavaScript loading, not public reachability.

Direct `eas update` exported the native app but this cloud proxy returned **403** for Expo's storage upload servers. The required network additions were saved as an environment draft; a saved draft does not activate networking. The GitHub-connected workflow above publishes from Expo's own runner instead. Do not share a private LAN QR or promise a working cloud tunnel based on token availability alone.

### Fast UI and foreground-audio check with Expo Go

Copy or download this project onto a computer on the same Wi-Fi as your iPhone. Install Node 24 LTS on the computer and Expo Go from the App Store on the iPhone; Expo Go's current version must support **SDK 57**. Sign in to Expo Go using your normal Expo account. In the local project folder:

```sh
npm ci
npx expo login
npx expo start --go --host lan
```

For `expo login`, use the same Expo account as on the iPhone. [Expo requires matching sign-ins for physical iOS devices](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/). The cloud's automated Expo account is intended for EAS build tools; use your own normal account for local Expo Go testing. Keep the terminal open, scan its QR code with the iPhone Camera app, and tap the banner to open it in Expo Go. Test onboarding, the library, foreground audio controls, and saved data. `--go` is explicit because this project also includes `expo-dev-client`. The cloud machine's private LAN QR address generally will not be reachable from your iPhone. Use the local-computer instructions above instead of scanning that cloud address. If same-Wi-Fi connection fails, try `npx expo start --go --tunnel` on that computer and scan the new QR code; Expo may prompt to install its tunnel helper. Web preview in iPhone Safari is useful for responsive layout, but is not a native-app test. The GitHub Pages URL opens the browser version and is not an Expo Go QR code.

### Native background audio and lock-screen controls

First test the hosted update in iOS Expo Go: start a practice, lock the phone for at least a minute, and try Control Center play/pause and seeking. SDK 57 Expo Go already includes `UIBackgroundModes: audio` ([official container configuration](https://github.com/expo/expo/blob/sdk-57/apps/expo-go/ios/Exponent/Supporting/Info.plist)). The player caches the sample before playing, restores position before autoplay, and keeps the native session available through track changes and lock-screen pauses. The visualizer stops drawing in the background without pausing audio. This fixes identified startup/session races; physical iPhone behavior still requires testing.

Use a **development build** to validate this app's own native configuration before release. On a **Mac** with current Xcode, command-line tools, CocoaPods, and a connected iPhone with Developer Mode enabled:

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
| This app's iOS background-audio capability | iOS SDK 57 Expo Go has its own audio background mode; test screen lock there. Web follows browser rules | **Required** to validate this app's own native capability before release |
| Native lock-screen / Control Center controls | Test iOS Expo Go on the phone; browser support varies | Validate production controls and metadata on a device |
| Android sustained background playback / media service | Expo Go does not apply this app's manifest | **Required**; test with `npx expo run:android --device` on an Android development machine |

Device checklist: listen with the screen locked and app backgrounded; try lock-screen play/pause, seeking, and metadata; make or receive a call; unplug headphones and disconnect Bluetooth; manually resume; finish a session; kill/reopen the app and check the paused restored position; try large Dynamic Type, VoiceOver, Reduce Motion, and Android TalkBack. Confirm Android background audio lasts beyond three minutes. The app does not request microphone permissions.

## What is included

- Goal and session-length onboarding; preferences can be edited later.
- Today recommendations based on selected goals, duration, and previously practiced lessons; two quick resets.
- Eight illustrative practices, searchable and filterable by six topics and favorites.
- A 14-day journey with local progress. Listening to the end marks the lesson practiced and completes the next matching path day; a circle lets you self-report another practiced day. There are no psychological scores, locked days, promised outcomes, or streak penalties.
- A single persistent player across the main screens, with play/pause, actual duration, seeking, ±15-second controls, speed, errors/retry, completion, and saved listening position. Restored sessions begin paused.
- Native Expo Audio session uses `playsInSilentMode`, `shouldPlayInBackground`, and `doNotMix`. `expo-audio`'s config plugin enables the iOS audio background mode and Android media playback service. Lock-screen controls are registered with title and demo metadata. Native OS interruptions and headset disconnection can pause playback; users choose when to resume.
- Responsive safe-area layouts, readable off-white text, gold controls, and original static cosmic vector art. A transparent gold-and-teal waveform spans the player background without a card or label. It drifts slowly and quietly while paused, then increases in height, opacity and pace during playback. The full and mini players stop drawing in the background and stay still with Reduce Motion. It is a visual rhythm, not frequency analysis. Static art and disabled navigation animations respect reduced motion. System fonts retain platform text scaling; native accessibility still requires device testing.

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
  AudioProvider.tsx         Native Expo Audio session, cached sources and lock screen
  nativePreparation.ts      Cancellable load → restore seek → playback-rate preparation
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

Playwright uses `/usr/bin/chromium` when available in this cloud machine. On another computer, run `npx playwright install chromium` first. `TEST_BASE_URL` can point the tests at another local port or a hosted URL, including `http://localhost:8084/rewired/` for a Pages build. Browser tests cover real time advancement, play/pause, seeking, skipping, speed changes, persistence across reloads, favorites, progress, filters, empty states, mobile layout, and reduced motion. `expo export --platform all --max-workers 2` additionally bundles iOS, Android, and web JavaScript; it is not a native binary build.

Native config introspection verifies the background mode, media service, and absence of microphone permissions. Actual iOS/Android binaries, hardware interruption behavior, OS background lifetimes, native assistive technologies, and lock-screen controls require the device checklist above. No remote deployment or GitHub upload is performed by these commands.

Current cloud validation: a clean `npm ci` succeeded; TypeScript passed; all **7 content/state tests** and **3 browser tests** passed; web, iOS, and Android JavaScript bundles exported; native audio configuration assertions passed. Chromium inspection covered desktop and a 320-pixel mobile viewport, with no horizontal overflow. The mobile browser test simulated 1.4× text and reduced motion. The web server returned HTTP 200 and was left running for iteration. No physical-device or signed native-binary testing was performed. This session has no tool for opening a user-facing built-in browser panel; the preview was inspected with automated Chromium instead.

The cloud Expo CLI may report an optional React Native DevTools launch failure because its desktop sandbox helper cannot run here. The Metro server and web preview still run; use browser developer tools for the preview and native developer tools on your local development machine.

Public preview validation: GitHub's Pages build and deployment succeeded. All 3 browser tests passed against the Pages build served locally at its `/rewired` base path. Verified HTTPS downloads of all 54 served app and route files matched that tested build byte for byte; main direct routes returned HTTP 200, and a sample audio byte-range request returned HTTP 206 with the correct bytes. Cloud Chromium could not run tests against the HTTPS site because it does not trust the environment's proxy certificate. Automatic approval review rejected adding that certificate to the browser's persistent trust store; no certificate checks were disabled. Hosted browser interaction therefore remains a manual check or a test on a normally configured local computer.

Hosted iPhone preview validation: workflow `01a11449-f810-73d2-aa07-c7570038ef62` published iOS update `01a1144b-3d36-7591-8840-cf16262ee25e` from source commit `bb6139543dd3862843c9baabba6eff341a5ce965` to `rewired-go-preview`. Publication and asset verification both succeeded: all **46 native files**, including the Hermes bundle and **three audio samples**, downloaded with matching SHA-256 hashes (**14,777,772 bytes** total). The QR independently decoded to the exact `exps://` update URL. TypeScript, **15 unit tests**, native configuration checks and all **4 browser tests** passed, with the browser tests also passing against the Pages export. Waveform checks cover full-width transparent placement, slow idle motion, playback amplification, unique SVG gradients and Reduce Motion. These checks do not run the native app on an iPhone: screen-lock playback, remote commands, interruptions and the device checklist still require a physical-device test.

For future direct uploads from this cloud machine, saved environment network additions include Expo's manifest host (`u.expo.dev`), asset CDN (`assets.eascdn.net`), upload storage (`storage.googleapis.com` and `update-assets-upload-production.storage.googleapis.com`), and dashboard (`expo.dev`). A successful draft save does not apply or publish those settings: review/save them in environment settings, then publish the environment. The working GitHub-connected publication route avoids the blocked workspace upload; activating this draft is not a prerequisite for opening the existing phone preview.

Official guidance consulted: [Expo Router installation](https://docs.expo.dev/router/installation/), [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), and [development builds](https://docs.expo.dev/develop/development-builds/introduction/), using their official `expo/expo` documentation source when this environment blocked the documentation site. Native versions were selected from SDK 57's bundled compatibility manifest and checked with `expo install --check`.

Next steps: replace sample recordings and validate content; run native device checks; refine accessibility with users; then design purchase verification and hosted-content delivery as separate milestones.

## Playback reliability update

Native samples are downloaded to the asset cache before playback. Source readiness and the saved-position seek must finish before play; cancelled requests cannot start an earlier lesson. The native player keeps its audio session active so the SDK's delayed pause cleanup cannot deactivate a newly buffering track, and lock-screen metadata is updated without repeatedly registering remote commands. Audio mode configuration errors surface for retry. Calls and headphone disconnection remain OS-managed interruptions; the app does not automatically restart interrupted audio. The selected session remains available while paused for lock-screen resume. Browser play promises ignore superseded requests.

Validation adds cancellation, readiness/seek ordering, end-position and decoder-failure unit coverage, plus browser checks for full-width transparent waves, idle motion, playback amplification and Reduce Motion. Hardware screen-lock, remote commands, Bluetooth and phone-call behavior must be checked on an iPhone; passing browser and configuration checks cannot prove those behaviors.

The phone loading regression was reproduced using the exact `abort-controller` shim installed by React Native 0.86 (`Libraries/Core/setUpXHR.js`). That shim lacks `AbortSignal.throwIfAborted()` and `AbortSignal.reason`, although Node exposes both. Preparation now uses `signal.aborted` and an explicit cancellation error. Regression tests exercise successful preparation and cancellation with the actual React Native shim; browser-only playback tests could not detect this mismatch.
