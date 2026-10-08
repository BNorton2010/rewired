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

Open **[the iPhone preview page](https://bnorton2010.github.io/rewired/phone-preview/)** in Safari. Sign into Expo Go as **`bnorton2010`**, return to that page, and tap **Open in Expo Go** once to switch from the old pinned snapshot to the stable preview. For this update, fully quit Expo Go from the iPhone app switcher, reopen the same Safari preview page, and tap its gold button while online. Check Player → Playback information for `polish-5`. Reload on a pinned snapshot fetches that same pinned URL; opening an already-running app may forward a link without checking remotely. A fresh launch can fall back to cached content after a failed remote check. Authenticated latest-version loading still needs a physical-phone check.

The stable URL is `exps://u.expo.dev/f824a207-b43d-4e95-9e57-f38e4a693d80?channel-name=rewired-go-preview&runtime-version=0.1.0&platform=ios`. The `rewired-go-preview` channel is linked to our existing branch of the same name. Its URL selects the latest compatible iOS update rather than pinning an update ID. Expo supports update selection through these [request query parameters](https://expo.fyi/eas-update-missing-headers); [channels link builds to update branches](https://docs.expo.dev/eas-update/how-it-works/). Each publication remains immutable, but the channel selects the newest one. A live development server is not needed.

`public/phone-preview/preview.json` records the stable URL, latest verified update ID, SDK, source commit and a pinned fallback URL. After publication, refresh its verification metadata and fallback link, and verify that the stable channel selects that update. Keep the main button and QR unchanged for compatible JavaScript/content updates. If the runtime changes, recheck compatibility and update the URL's runtime selector and QR together. This is published preview delivery, not Fast Refresh; changes still have to be published to Expo.

The connected Expo project can fetch this repository directly from GitHub. The manual-only workflow in `.eas/workflows/phone-preview.yml` publishes an iOS update to the isolated **`rewired-go-preview`** branch. It does not build an iOS binary, submit to the App Store, change existing production channels, or publish automatically on every commit. The account is on Expo's Free plan; no paid service or Apple Developer membership is required for this preview.

After committing and pushing an authorized change to GitHub, run:

```sh
npx eas-cli@latest workflow:run .eas/workflows/phone-preview.yml --ref HEAD --non-interactive
```

`--ref HEAD` asks Expo to fetch that exact GitHub commit rather than uploading this cloud workspace. Check the workflow's success and published update in [the Expo project](https://expo.dev/accounts/paid-to-bring-peace/projects/beau). Keep using the stable launch link and QR after verifying that the channel selects the new iOS update and all its assets are downloadable. A QR must point to the native Expo Go preview; the GitHub Pages link opens the browser app. On an iPhone alone, use a tappable preview link or Expo's Preview button, since the Camera app cannot scan a QR displayed on the same screen. Physical iPhone compatibility and audio still require a device check.

The workflow confirms that the stable channel resolves to the pinned update, downloads the published manifest and every native file, checks their SHA-256 hashes, confirms the SDK and presence of three audio samples, and validates the Hermes bundle. Expo provides temporary per-asset authorization in the manifest's multipart `extensions` part; the verifier forwards those headers only to Expo's CDN and never prints or stores them. Plain downloads without these headers can return 403 even for a valid update. To check an existing update without publishing another one:

```sh
npx eas-cli@latest workflow:run .eas/workflows/check-phone-preview.yml --ref HEAD \
  -F update_id=01a114c4-1ce5-712b-94a6-208fd36b4230 --non-interactive
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

First test the hosted update in iOS Expo Go: start a practice, wait until the playback time advances, lock the phone for at least a minute, and try Control Center play/pause and seeking. SDK 57 Expo Go already includes `UIBackgroundModes: audio` ([official container configuration](https://github.com/expo/expo/blob/sdk-57/apps/expo-go/ios/Exponent/Supporting/Info.plist)) and Expo Audio 57.0.5 ([container dependencies](https://github.com/expo/expo/blob/sdk-57/apps/expo-go/ios/Podfile.lock)). The player caches the sample before playing, restores position before autoplay, configures the complete background/silent playback mode, shares and caches audio-mode preparation before remote registration/play; native `player.play()` activates the iOS session itself, and keeps the session available through track changes and lock-screen pauses. The visualizer stops drawing in the background without pausing audio. Startup guards prevent a superseded source or pause during an asynchronous session call from autoplaying.

The reported iPhone screen-lock stoppage is **not yet reproduced or confirmed fixed on a physical phone**. The prior background flag was already enabled, and SDK source does not show a Go host suspend override; repeating audio setup on every tap did not establish the cause and has been removed to improve responsiveness. If it still stops, return to the player → **Playback information → Share playback report**, choose Copy, then paste it into this chat. The memory-only report includes `polish-5`, the actual Expo Go/app/OS/update versions, recent AppState/session/status events and current playback state. It excludes credentials, file URLs, raw error messages and device identifiers. No diagnostic data is uploaded automatically. Foregrounding only restores the session category; it never overrides calls, headset removal or remote pause with automatic play.

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
- The approved black/plum/gold redesign applies to every screen. Bundled Cormorant Garamond headings and DM Sans controls sit beside original celestial cover artwork; open practice rows replace most bordered cards. The player has a satin-gold medallion, matching 15-second controls, a gold seek track, and a unified speed/text/save toolbar. Native seeking uses the already-installed UISlider/Android SeekBar, with iOS track tapping. The player keeps normal vertical scrolling; cancelled slider gestures clear locally without locking the whole screen. Exact native seek tolerances and a serial queue retain the newest destination instead of letting overlapping requests cancel it. Thumb drafts survive transport ticks and wait for acknowledgement. Web keeps a keyboard-accessible range input, allows vertical touch pans, and commits horizontal drags on release. Text scales, layouts respect safe areas, and short screens scroll.
- A full-width transparent gold aurora sits explicitly underneath the player foreground. Four soft filled Bézier ribbons change their actual shape, amplitude and thickness as different harmonics flow rightward; a static texture is no longer translated across the screen. Brighter champagne/gold gradients make the wave visible while idle and fuller during playback. The native renderer no longer allocates large blur/filter/mask bitmaps per animation frame; four ribbons and half as many curve segments also reduce geometry work. Motion runs at 30 fps on the native UI thread using the project's existing Reanimated/worklets modules, slower and smaller while idle. Phase is preserved at playback changes. Reduce Motion freezes shape changes, and backgrounding stops only visual animation. It is atmospheric, not a measurement of audio frequencies. [Design notes and approved references](docs/design.md) describe the components, assets and animation.


## Content and licensing

All visible lessons are **illustrative demo content**. The bundled 3-, 5-, and 9-minute files are original **instrumental ambient samples**, not final narrated practices. Reading companions are explicitly labeled as reflective text, not transcripts of a voice recording. There is no audio-generation feature in the app.

The audio files and synthesis recipe are CC0; see [the audio license](assets/audio/LICENSE.md). The three celestial illustrations are original AI-generated assets created for the approved design; see [artwork provenance](assets/artwork/README.md). The locally bundled fonts use the SIL Open Font License; licenses are included in [assets/fonts](assets/fonts/README.md). There are no third-party stock recordings. Optional sample rebuilding uses the checked-in Python recipe and ffmpeg; the app does not need those tools to run.

To replace content:

1. Edit lesson titles, topics, descriptions, lengths, intentions, and reading text in `src/content/catalog.ts`.
2. Replace the static audio mappings in `src/audio/sources.ts`. Each lesson currently shares the sample for its duration; final recordings should be keyed by lesson ID. Audio displays its actual loaded duration, not an invented final-recording duration.
3. Replace the masters in `assets/artwork`, run `python scripts/optimize-artwork.py` (Pillow required only when editing assets), or adjust the map in `src/ui/CosmicArt.tsx`. Keep artwork descriptions decorative unless they convey information.
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
  nativeSession.ts          Shared mode preparation and synchronous warmed playback
  nativeSeek.ts             Exact serial seeks; newest request wins
  nativeDiagnostics.ts      Bounded, sanitized, memory-only device report
  AudioProvider.web.tsx     Browser HTMLAudioElement with explicit play/error handling
  contexts.tsx              Stable controls separated from ticking progress
src/content/                Catalog, recommendation, search, and path logic
src/persistence/            AsyncStorage, versioned local state, ordered writes
src/integrations/demo.ts    Explicit future account/entitlement boundary
src/ui/                     Shared controls, artwork, theme, mini-player
  PlayerControls.tsx        Satin-gold transport and action toolbar
  PlaybackVisualizer.tsx    Continuous aurora; motion/background handling
  SeekBar.tsx               Gold web range and native accessible system slider
  nativeSeekGesture.ts      Native cancellation and touch-end timer guard
  auroraGeometry.ts         Continuously deforming gold ribbon geometry
  seekInteraction.ts        Drag/seek acknowledgement without thumb snap-back
assets/artwork/             Editing masters + optimized covers/thumbnails
assets/fonts/               Bundled font faces, provenance and OFL licenses
docs/design.md              Visual system and approved mockups
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

Player validation: TypeScript and **54 unit tests** passed. Coverage includes shared mode preparation, synchronous warmed playback, foreground invalidation, native session/playback races, serial seeks, diagnostic sanitization, held-thumb acknowledgement, continuous rightward wave deformation, and cancelled native slider completion, fresh-drag recovery and timer cleanup. **All 8 browser tests passed against the production Pages build**; the changed aurora check also passed on the development server. They exercise real audio playback, seeking/skipping/speed, completion, persistence, favorites, search/filter, rapid pause and error recovery. Pointer tests cover dragging, track taps, outside release and keyboard seeking. Real Chromium touch gestures verify vertical scrolling over player content and controls, cancelling a vertical pan on the seek track, and horizontal seeking afterward. Visual checks cover brighter gold filled paths without SVG filters/masks, the visible preview marker, foreground stacking, unobstructed controls, full-width 390px placement, idle motion, playback amplification, Reduce Motion, fonts/artwork and 1.6× text at 320px. Production screenshots and approved references are in [the design notes](docs/design.md). Native configuration assertions and web/iOS/Android JavaScript exports passed; export is not a signed native build. Slider 5.2.0, Reanimated 4.5.1, worklets 0.10.1 and SVG 15.15.4 already match SDK 57's bundled modules. No native dependency/config change or new Expo Go binary is required for this update.

The web development server remains on port 8081 for iteration. The Pages build is validated separately at its `/rewired` base path. The local static preview helper now serves directory entry files, including the iPhone launch page; a generated celestial favicon avoids broken browser-icon requests. No physical device or signed native-binary testing has been performed. Verify native aurora smoothness, scrub gestures, VoiceOver/Dynamic Type, screen-lock playback, remote controls and interruptions using the device checklist above.

The cloud Expo CLI may report an optional React Native DevTools launch failure because its desktop sandbox helper cannot run here. The Metro server and web preview still run; use browser developer tools for the preview and native developer tools on your local development machine.

Public preview validation: all **8 browser tests** passed against the production Pages build served locally at `/rewired`. Normally verified HTTPS confirmed all **53 hosted files (11,823,897 bytes)** match that tested build byte for byte. This is about 47% smaller than the preceding 22,264,848-byte export. Main-screen/iPhone-launch routes returned 200, and an audio range request returned 206 with matching bytes. The hosted browser now contains `polish-5`. Cloud Chromium does not trust the environment's HTTPS proxy certificate; hosted interaction is tested locally plus normal HTTPS artifact comparisons, with no certificate checks disabled. Actual phone behavior remains a device check.

The previous phone workflow `01a116e6-daf2-7b50-ad91-c782f084dfe7` **failed**, rather than remaining queued. Expo reported `SERVER_ERROR: Failed to fetch project sources. Re-run the job.` after about 109 minutes queued and 173 seconds preparing the project. It never reached installation, tests, export or publication. GitHub source access was verified healthy afterward. Consequently desktop source `a63ff706` and the last verified phone source `4682b71a` differed; a phone appearance report cannot yet establish a renderer difference in the same release. The replacement publication below succeeded using the same workflow and stable channel.

Hosted iPhone preview validation (`polish-5`): workflow `01a11956-4160-7b79-bf20-91ca29fc8f2d` published iOS update `01a11957-b21a-7523-b13b-7151f6ee80bd` from exact source `87b907662cdcb82dadd9c7562a58617dc97816d5` to `rewired-go-preview`. Both publication and verification jobs succeeded. The permanent channel selected the new update; all **38 native files**, including the Hermes bundle, optimized artwork/fonts and **three audio samples**, downloaded with matching SHA-256 hashes (**12,724,798 bytes**). This is about 45% smaller than the preceding 23,071,249-byte native preview. The main launch URL and QR remain unchanged. These checks establish publication and downloadable integrity, not actual iPhone rendering, scrolling or screen-lock behavior. Confirm the player marker on the device; if locking stops audio, share the optional sanitized playback report.

For future direct uploads from this cloud machine, saved environment network additions include Expo's manifest host (`u.expo.dev`), asset CDN (`assets.eascdn.net`), upload storage (`storage.googleapis.com` and `update-assets-upload-production.storage.googleapis.com`), and dashboard (`expo.dev`). A successful draft save does not apply or publish those settings: review/save them in environment settings, then publish the environment. The working GitHub-connected publication route avoids the blocked workspace upload; activating this draft is not a prerequisite for opening the existing phone preview.

Official guidance consulted: [Expo Router installation](https://docs.expo.dev/router/installation/), [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/), and [development builds](https://docs.expo.dev/develop/development-builds/introduction/), using their official `expo/expo` documentation source when this environment blocked the documentation site. Native versions were selected from SDK 57's bundled compatibility manifest and checked with `expo install --check`.

Next steps: replace sample recordings and validate content; run native device checks; refine accessibility with users; then design purchase verification and hosted-content delivery as separate milestones.

## Playback reliability update

Native samples are downloaded to the asset cache before playback. Source readiness and the saved-position seek must finish before play; cancelled requests cannot start an earlier lesson. The native player keeps its audio session active so the SDK's delayed pause cleanup cannot deactivate a newly buffering track, and lock-screen metadata is updated without repeatedly registering remote commands. Audio mode configuration errors surface for retry. Calls and headphone disconnection remain OS-managed interruptions; the app does not automatically restart interrupted audio. The selected session remains available while paused for lock-screen resume. Mode preparation is cached and shared; warm resumes call native play synchronously instead of waiting for two setup bridge calls. Pause updates control state immediately, rapid taps use a synchronous pending-start ref, and actual native status still reconciles interruptions. Unchanged lock-screen metadata is not rewritten on every tap. Browser play promises ignore superseded requests.

Validation adds cancellation, readiness/seek ordering, end-position and decoder-failure unit coverage, plus browser checks for full-width transparent waves, idle motion, playback amplification and Reduce Motion. Hardware screen-lock, remote commands, Bluetooth and phone-call behavior must be checked on an iPhone; passing browser and configuration checks cannot prove those behaviors.

The phone loading regression was reproduced using the exact `abort-controller` shim installed by React Native 0.86 (`Libraries/Core/setUpXHR.js`). That shim lacks `AbortSignal.throwIfAborted()` and `AbortSignal.reason`, although Node exposes both. Preparation now uses `signal.aborted` and an explicit cancellation error. Regression tests exercise successful preparation and cancellation with the actual React Native shim; browser-only playback tests could not detect this mismatch.

Initial permanent-link validation: Expo workflow `01a11453-7ce6-790a-96c4-341355dac921` succeeded without publishing a new app update. It confirmed the stable channel selects update `01a1144b-3d36-7591-8840-cf16262ee25e` and verified all 46 native files and their hashes. The stable QR decoded independently from its PNG and a rendered 320px launch page. The page also passed link, pinned fallback, larger-text and no-overflow checks. An anonymous request with actual SDK 57 iOS Expo Go headers received the expected account-membership requirement; authenticated phone launch and Reload still need a user-device check.


## Performance polish (`polish-5`)

The investigation found independent sources of work:

- Original artwork was about 2.1–2.2 MB per PNG. Even 46–72-point covers used those full images. Optimized covers and 288px thumbnails total **598,678 bytes**, down from **6,567,857 bytes** (90.9% smaller); editing masters remain replaceable but are not bundled. A separate 128px favicon replaces the full cover. Artwork is memoized using actual style values.
- Native playback status changes every 250 ms, and browser media time updates also published the whole audio context. This made the full player, images, practice rows and transport controls eligible to render for every tick. Stable control/lesson state now has its own context; only seek/timestamp and mini progress children subscribe to the playhead.
- Importing Feather from the icon-package entry point bundled unused icon font packs. A direct Feather import excludes those unused packs and reduces both assets and JavaScript.
- Position saves every three seconds published the whole UI store. Positions remain persisted in the existing schema and ordered write queue, but transports read them through `getPosition`; unrelated screen consumers no longer update on each save. Identical position, lesson and speed writes are skipped.
- Aurora segments recalculated their shared endpoints. Reusing them removes 28 of 58 point evaluations per ribbon, preserving all 800 checked paths byte for byte. The animation stops offscreen. The phone idle wave is more visible, while desktop intensity is reduced to keep its larger area soft. Both use the same gradient rendering without native blur/mask bitmap passes.

A ReactDOM render-count harness exercised the actual native provider, store and seek component with native I/O mocked. Across 60 status ticks, the screen/controls rendered **60 → 0** times while progress still updated 60 times. Five position writes caused navigation/screen renders **5 → 0**. Sixty native slider move events caused React commits **60 → 0**, with one completed seek to the final target. Saved position hydration, persistence and play/pause also passed. These are React work counts, not physical-device frame-rate measurements.

A browser probe with 4× CPU throttling measured 12 play/pause button-feedback changes: 30 ms median, 49 ms slowest/p95. This measures the accessible control label, not audio hardware start latency.

Warm native playback still uses shared session preparation and synchronous native play; pause feedback is immediate. Initial sample loading, OS interruptions and audio decoding remain distinct from button feedback. Browser checks and exported bundles do not measure physical iPhone frame rate or prove screen-lock playback. Confirm `polish-5` in Player → Playback information before device testing.
