import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALLERGEN_TAG_INFO } from '../data/allergenTagInfo';
import type { AllergenStatus } from '../lib/database.types';
import { colors } from '../navigation/theme';

const STATUS_OPTIONS: AllergenStatus[] = ['safe', 'may_contain', 'contains'];

/** Small numbered heading for a step in a submission form ("1  Which allergen?"). */
export function StepLabel({ step, text }: { step: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

/**
 * Safe / May contain / Contains as one segmented control -- deliberately a
 * different shape (a single joined bar, colored outlines, status dots) from
 * the pill-shaped allergen chips above it, so the status reads as an answer
 * about the chosen allergen, not one more allergen to pick.
 */
export function StatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: AllergenStatus | null;
  onChange: (status: AllergenStatus) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.segmented}>
      {STATUS_OPTIONS.map((status, index) => {
        const info = ALLERGEN_TAG_INFO[status];
        const selected = value === status;
        return (
          <TouchableOpacity
            key={status}
            disabled={disabled}
            onPress={() => onChange(status)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              index > 0 && styles.segmentDivider,
              selected && { backgroundColor: info.color },
            ]}
          >
            {selected ? (
              <Ionicons name="checkmark" size={13} color="#fff" />
            ) : (
              <View style={[styles.dot, { backgroundColor: info.color }]} />
            )}
            <Text style={[styles.segmentText, { color: selected ? '#fff' : info.color }]}>{info.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    marginBottom: 7,
  },
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
  },
  segmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
