import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FirstLaunchNotice } from './src/components/FirstLaunchNotice';
import { ensureAnonymousSession } from './src/lib/supabase';

export default function App() {
  // Quietly sign this device in with an anonymous account (see supabase.ts).
  useEffect(() => {
    ensureAnonymousSession();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <FirstLaunchNotice />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
