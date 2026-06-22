// Port of ChessLoader.kt — a centered spinner with a label, shown while the 3D
// engine loads/tears down. Uses ActivityIndicator (cross-platform).

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function ChessLoader({ text = 'Loading 3D Board' }: { text?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="black" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 8, color: 'black' },
});
