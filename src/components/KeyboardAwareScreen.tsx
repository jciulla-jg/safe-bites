import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

/**
 * Wraps a screen so the on-screen keyboard shrinks it instead of covering
 * the text box being typed in. Needed on Android too: with edge-to-edge
 * (always on in current Expo) the window no longer resizes for the keyboard
 * by itself. The header height is the offset because the screen's content
 * starts below the navigation header.
 */
export function KeyboardAwareScreen({ children }: { children: ReactNode }) {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
