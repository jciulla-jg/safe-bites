import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../navigation/theme';

const ACK_KEY = 'safe-bites/notice-acknowledged-v1';

/**
 * Shown once per device before first use: Safe Bites is a guide, not medical
 * advice. A public allergy app should make that explicit, not just in fine
 * print. Stored on the device; if storage is unavailable it simply shows again.
 */
export function FirstLaunchNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACK_KEY)
      .then((value) => setVisible(value !== 'yes'))
      .catch(() => setVisible(true));
  }, []);

  function acknowledge() {
    setVisible(false);
    AsyncStorage.setItem(ACK_KEY, 'yes').catch(() => {});
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={acknowledge}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <ScrollView contentContainerStyle={styles.content}>
            <Ionicons name="shield-checkmark" size={28} color={colors.brand} />
            <Text style={styles.title}>Before you use Safe Bites</Text>
            <Text style={styles.body}>
              Safe Bites is a guide, not medical advice. Allergen information comes from published menus, chain
              allergen guides and other diners. It's not confirmed with kitchens, and recipes change.
            </Text>
            <Text style={styles.body}>
              If you have a food allergy, always tell your server and confirm with the restaurant before you eat.
            </Text>
            <Text style={styles.small}>
              Your restrictions and saved places stay on this device. Anything you submit (ratings, feedback, menu
              items) is public. Details are under Profile → About & privacy.
            </Text>
          </ScrollView>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={acknowledge}>
            <Text style={styles.buttonText}>I understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 47, 59, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { backgroundColor: colors.card, borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '85%', padding: 20 },
  content: { gap: 10, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  small: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  button: { backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
