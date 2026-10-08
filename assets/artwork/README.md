# Celestial artwork

These three original AI-generated illustrations were created for the approved Re-Wired FM redesign. They are presentation assets, not photos of real locations. They ship locally; no image service or API is required. The app renders actual interface components over or beside them, not mockup screenshots.

- `dawn.png`: gold dawn over plum clouds; Today and creativity covers.
- `eclipse.png`: gold-rimmed dark planet; self-trust and player covers.
- `receiving.png`: dark purple coastal horizon; receiving, focus and journey covers.

These PNGs are editing masters, retained for replacing the artwork. They are not imported by the app or included in its published asset bundle. `optimized/` contains the actual local app assets:

- JPEG covers: at most 1280 pixels along either edge, used for artwork panels and the player. Smaller originals are not upscaled.
- JPEG thumbnails: 288×288 center crops, used for rows and the mini-player up to 96 logical pixels. This covers a 3× iPhone display without decoding a large cover or unused landscape edges for every row.
- A 128×128 PNG favicon for the browser.

The three original PNGs total **6,567,857 bytes**. All six JPEG variants total **598,678 bytes**, a **90.9% reduction**; including the favicon, the published artwork totals **629,357 bytes**. A 288×288 thumbnail uses about 324 KiB as a decoded RGBA bitmap, compared with about 6 MiB for the original 1254×1254 eclipse PNG. JPEG is supported by React Native's built-in `Image` on iOS, Android, and web; no image service or additional native dependency is needed.

Replace a master file, then run `python3 scripts/optimize-artwork.py` from the repository to regenerate its variants. That editing command needs [Pillow](https://pillow.readthedocs.io/en/stable/installation/basic-installation.html) (`python3 -m pip install Pillow` in your asset-editing environment). Python and Pillow are not runtime requirements. Alternatively, supply equivalent JPEGs directly in `optimized/`, or adjust the artwork map in `src/ui/CosmicArt.tsx`. Keep the small and large variants in that map, rather than importing a source master. Audio and listening-path logic do not depend on these assets. The approved mockups are design references only.
