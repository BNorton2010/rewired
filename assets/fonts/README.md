# Bundled typography

Cormorant Garamond Medium (display headings) and DM Sans Regular, Medium and SemiBold (interface/body text) are bundled locally and loaded with `expo-font` at runtime. This works in Expo Go and on the web without requesting a new native binary or a font CDN. All body text allows platform font scaling; the number inside the skip icon is part of its fixed glyph.

Static TTF files come from the official [`expo/google-fonts` font packages](https://github.com/expo/google-fonts/tree/master/font-packages). Both families use the SIL Open Font License 1.1. Their licenses are included here, sourced from [`google/fonts`](https://github.com/google/fonts). The type tokens live in `src/ui/theme.ts` and font loading in `app/_layout.tsx`.
