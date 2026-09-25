import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FirstLaunchNotice } from './src/components/FirstLaunchNotice';
import { ensureAnonymousSession } from './src/lib/supabase';
import { colors } from './src/navigation/theme';

// On a wide browser window (a laptop demo), show the whole app -- header,
// screens and tab bar -- as one centered column instead of stretching it
// edge to edge. Phones and narrow windows are unchanged.
const WIDE_WINDOW = 900;
const APP_COLUMN_WIDTH = 760;

export default function App() {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= WIDE_WINDOW;

  // Quietly sign this device in with an anonymous account (see supabase.ts).
  useEffect(() => {
    ensureAnonymousSession();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={[styles.page, wide && styles.pageWide]}>
        <View style={[styles.column, wide && styles.columnWide]}>
          <RootNavigator />
        </View>
      </View>
      <FirstLaunchNotice />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageWide: { backgroundColor: '#dfe6e9', alignItems: 'center' },
  column: { flex: 1, width: '100%' },
  columnWide: {
    maxWidth: APP_COLUMN_WIDTH,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    boxShadow: '0 0 24px rgba(8, 47, 59, 0.12)',
  },
});
