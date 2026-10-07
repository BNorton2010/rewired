import React from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ArtworkKind } from '../content/catalog';

// Deliberately local: replace these files or this map to change the art direction.
const artwork: Record<ArtworkKind, number> = {
  sunrise: require('../../assets/artwork/dawn.png'),
  orbit: require('../../assets/artwork/eclipse.png'),
  moon: require('../../assets/artwork/receiving.png'),
  nebula: require('../../assets/artwork/dawn.png'),
  ocean: require('../../assets/artwork/receiving.png'),
};
export function CosmicArt({ kind = 'sunrise', style, orbit = false }: { kind?: ArtworkKind; style?: StyleProp<ViewStyle>; orbit?: boolean }) {
  return <View style={[{ backgroundColor: '#160E1D', overflow: 'hidden' }, style]} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Image testID="celestial-artwork" source={artwork[orbit ? 'orbit' : kind]} resizeMode="cover" style={{ width: '100%', height: '100%' }} accessible={false} />
  </View>;
}
