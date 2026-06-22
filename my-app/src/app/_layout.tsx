// Root layout. The chess app is a single screen, so this sets up a header-less
// Stack and the system color scheme. Replaces the template's tab layout.
//
// GestureHandlerRootView wraps the app so react-native-gesture-handler can drive
// the 3D camera (drag-to-orbit, pinch-to-zoom) inside <Board3D/>.

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
