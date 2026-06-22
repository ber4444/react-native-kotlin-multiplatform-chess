// Shared popup card matching the Compose PopupWindow styling (RoundedCornerShape(25),
// centered on a semi-transparent scrim). Used by the game-over, promotion, and
// draw-offer dialogs.

import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function PopupCard({ children }: PropsWithChildren) {
  return (
    <View style={styles.scrim}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
});
