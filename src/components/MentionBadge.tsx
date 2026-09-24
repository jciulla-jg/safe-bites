import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../navigation/theme';

/**
 * A custom restriction (customRestrictions.ts) that a menu item's name or
 * description mentions. Dashed outline + warning icon so it reads as a
 * text-match warning, distinct from the solid reviewed allergen tags.
 */
export function MentionBadge({ keyword }: { keyword: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name="warning-outline" size={11} color={colors.unsafe} />
      <Text style={styles.text}>Mentions {keyword}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.unsafe,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.unsafe,
  },
});
