# Re-Wired FM visual system

The approved direction pairs near-black and deep plum with warm ivory, champagne gold, editorial typography, original celestial artwork, and a full-width moving aurora. It applies to onboarding, Today, Library, My Path, lesson detail, the full player and persistent mini-player. The app uses React Native components, not mockup screenshots or a WebView.

Approved references: [full direction](approved-direction.png) and [player refinement](approved-player.png). These documentation images are never rendered by the app.

Production screenshots: [Today](screenshots/today.png), [Library](screenshots/library.png), [Player](screenshots/player.png). These are captures of the working app at 390px.

## Palette and typography

`src/ui/theme.ts` is the source of truth. Background `#08060B`, surface `#120D18`, warm text `#FAF5E9`, secondary text `#B7ACBF`, and primary gold `#EEC676`. Purple and teal belong mainly to the art and aurora. Headings and practice titles use bundled Cormorant Garamond Medium; controls and paragraphs use DM Sans. Font licenses and provenance live in `assets/fonts`. Fonts load at runtime with Expo Font, allowing the same UI in Expo Go and web. A font loading error does not prevent the app from opening.

Use spacing and hairline separators instead of outlining every section. Primary actions use restrained satin gold, rounded rectangular buttons. Cover images use modest corner radii and consistent cropping. Practice rows and progress marks stay visually quiet. Demo labels and the distinction between ambient samples and reflective reading remain visible.

## Player and aurora

`src/ui/PlayerControls.tsx` owns the gold medallion, solid transport glyphs, matching 15-second controls and speed/text/save toolbar. Screen components connect them to the existing audio provider; they do not create players or alter session configuration. `src/ui/SeekBar.tsx` draws a consistent custom gold track and thumb: a real range input handles web keyboard/pointer access; native responder gestures commit a seek on release, with VoiceOver/TalkBack increment/decrement actions. Interactive targets are at least 44 points. Native gestures and assistive technology still need device validation.

`src/ui/PlaybackVisualizer.tsx` renders layered filled Bézier ribbons, diffuse SVG glow, silky highlights and a few gold/teal wisps. The effect sits behind the player, spans the full screen and never captures taps. It is an atmospheric visualization, not measured audio frequencies.

A native-driven horizontal transform moves the texture continuously rightward: 14 seconds per period during playback, 32 seconds while paused. Speed changes finish the current period without resetting its phase. Two visible periods plus a spare period on either side keep both geometry and blur pixels continuous at the loop boundary. Playback eases from 0.6 to 1.0 vertical scale and 0.28 to 0.72 opacity over 1.6 seconds. Reduce Motion freezes translation and removes the intensity transition. Backgrounding stops visual animation without pausing audio. The SVG is memoized, and native view rasterization caches the decorative layer; no frame-by-frame path generation or audio sampling is used.

## Responsive behavior

Phone navigation stays at the bottom, above the device safe area; desktop uses a quiet sidebar. The player uses available height to size its cover art and switches to a two-column layout on wide screens. Content scrolls for shorter screens and larger text. Search filters scroll horizontally; featured text containers can grow. Text scaling is enabled except for the fixed numeral drawn inside the skip icon.

## Assets and future changes

The three original AI-generated cover illustrations are stored in `assets/artwork`, with a replaceable map in `src/ui/CosmicArt.tsx`. The artwork README describes provenance and replacement. Illustrative audio, lesson IDs, recommendations, listening paths, persistence, account/purchase boundaries, runtime version and stable Expo channel retain their existing behavior. Final recordings and commissioned artwork can replace the bundled samples independently of the screens.

For each visual iteration, run TypeScript and browser flows, inspect a 320/390-pixel layout and a desktop layout, verify larger text and Reduce Motion, then build the Pages export. Publishing to the existing Expo channel keeps the user-facing launch link stable. The device checklist in the main README covers native animation, gestures, screen-lock playback and interruptions.
