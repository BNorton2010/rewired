import React, { memo } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ArtworkKind } from '../content/catalog';

// The source PNGs stay available as editing masters, but are never bundled.
// Small rows should not decode the same full-size cover as the player.
const covers = {
  dawn: require('../../assets/artwork/optimized/dawn-cover.jpg'),
  eclipse: require('../../assets/artwork/optimized/eclipse-cover.jpg'),
  receiving: require('../../assets/artwork/optimized/receiving-cover.jpg'),
};
const thumbnails = {
  dawn: require('../../assets/artwork/optimized/dawn-thumbnail.jpg'),
  eclipse: require('../../assets/artwork/optimized/eclipse-thumbnail.jpg'),
  receiving: require('../../assets/artwork/optimized/receiving-thumbnail.jpg'),
};
const artwork: Record<ArtworkKind, keyof typeof covers> = {
  sunrise: 'dawn', orbit: 'eclipse', moon: 'receiving', nebula: 'dawn', ocean: 'receiving',
};
type CosmicArtProps = { kind?: ArtworkKind; style?: StyleProp<ViewStyle>; orbit?: boolean };
const styles = StyleSheet.create({
  frame: { backgroundColor: '#160E1D', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});

function CosmicArtwork({ kind = 'sunrise', style, orbit = false }: CosmicArtProps) {
  const size = StyleSheet.flatten(style);
  const small = typeof size?.width === 'number' && typeof size?.height === 'number' && Math.max(size.width, size.height) <= 96;
  const source = (small ? thumbnails : covers)[artwork[orbit ? 'orbit' : kind]];
  return <View style={[styles.frame, style]} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image testID="celestial-artwork" source={source} resizeMode="cover" fadeDuration={0} style={styles.image} accessible={false} />
  </View>;
}

// Most callers provide inline style objects. Compare their actual values so a
// playback-clock update does not recreate an otherwise unchanged image tree.
export const CosmicArt = memo(CosmicArtwork, (previous, next) => {
  if (previous.kind !== next.kind || previous.orbit !== next.orbit) return false;
  if (previous.style === next.style) return true;
  const before = StyleSheet.flatten(previous.style) ?? {};
  const after = StyleSheet.flatten(next.style) ?? {};
  const keys = Object.keys(before) as (keyof ViewStyle)[];
  return keys.length === Object.keys(after).length && keys.every(key => before[key] === after[key]);
});
