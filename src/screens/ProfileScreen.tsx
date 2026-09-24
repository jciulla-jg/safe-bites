import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ALLERGENS } from '../data/allergens';
import { ALLERGEN_TAG_INFO } from '../data/allergenTagInfo';
import {
  loadProfile,
  saveProfile,
  RestrictionEntry,
  RestrictionProfile,
  SeverityLevel,
} from '../lib/profileStorage';
import type { ItemAllergenLabel } from '../lib/safetyStatus';
import {
  loadCustomRestrictions,
  MAX_CUSTOM_RESTRICTION_LENGTH,
  MAX_CUSTOM_RESTRICTIONS,
  saveCustomRestrictions,
} from '../lib/customRestrictions';
import { KeyboardAwareScreen } from '../components/KeyboardAwareScreen';
import { colors } from '../navigation/theme';

/**
 * Display order for the tag legend below -- best-case first, most-uncertain
 * last. ALLERGEN_TAG_INFO (src/data/allergenTagInfo.ts) is the shared source
 * for label/color/description, so this legend and the detail screen's
 * per-item badges can't drift out of sync.
 */
const TAG_LEGEND_ORDER: ItemAllergenLabel[] = ['safe', 'may_contain', 'contains', 'unknown'];

/**
 * ProfileScreen -- the restriction profile (allergens + severity), stored
 * on-device only per ADR-0002 (no auth/backend sync). Loads the saved
 * profile on mount and persists on every change via profileStorage.
 */

/**
 * Severity controls how strictly a restriction is enforced when computing a
 * restaurant/menu item's safety status (see safetyStatus.ts's
 * itemFailsRestriction) -- not just a label. Description shown when a diner
 * expands an active allergen card, so the practical difference between e.g.
 * "Allergy" and "Severe" isn't a guess.
 */
const SEVERITY_LEVELS: { value: SeverityLevel; label: string; color: string; description: string }[] = [
  {
    value: 'preference',
    label: 'Preference',
    color: '#7a9e79',
    description: 'Informational only — never marks a restaurant or item unsafe.',
  },
  {
    value: 'intolerance',
    label: 'Intolerance',
    color: '#c98a2e',
    description: '"May contain" is a warning, not disqualifying. Only an explicit "Contains" tag counts against a restaurant.',
  },
  {
    value: 'allergy',
    label: 'Allergy',
    color: '#c1622f',
    description: 'Only an explicit "Safe" tag counts when picking an item. Other menu items containing it are fine — you just order something tagged safe.',
  },
  {
    value: 'severe',
    label: 'Severe',
    color: '#b0242f',
    description: 'Same item rule as Allergy, but the whole restaurant is Unsafe if ANY menu item may contain it — shared-kitchen cross-contact risk matters for life-threatening reactions.',
  },
];

export function ProfileScreen() {
  const [profile, setProfile] = useState<RestrictionProfile>([]);
  const [loaded, setLoaded] = useState(false);
  const [tagLegendExpanded, setTagLegendExpanded] = useState(false);
  const [customRestrictions, setCustomRestrictions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomRestrictions().then(setCustomRestrictions);
  }, []);

  function addCustomRestriction() {
    const keyword = customInput.trim().replace(/\s+/g, ' ');
    if (!keyword) return;
    if (customRestrictions.some((k) => k.toLowerCase() === keyword.toLowerCase())) {
      setCustomError(`"${keyword}" is already on your list.`);
      return;
    }
    if (customRestrictions.length >= MAX_CUSTOM_RESTRICTIONS) {
      setCustomError(`You can add up to ${MAX_CUSTOM_RESTRICTIONS}.`);
      return;
    }
    const next = [...customRestrictions, keyword];
    setCustomRestrictions(next);
    saveCustomRestrictions(next).catch(() => {});
    setCustomInput('');
    setCustomError(null);
  }

  function removeCustomRestriction(keyword: string) {
    const next = customRestrictions.filter((k) => k !== keyword);
    setCustomRestrictions(next);
    saveCustomRestrictions(next).catch(() => {});
  }
  // Guards against writing the just-loaded profile straight back to storage.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadProfile().then((saved) => {
      if (cancelled) return;
      setProfile(saved);
      setLoaded(true);
      hasLoadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveProfile(profile);
  }, [profile]);

  const findEntry = useCallback(
    (allergenCode: string) => profile.find((e) => e.allergenCode === allergenCode),
    [profile]
  );

  const toggleAllergen = useCallback((allergenCode: string) => {
    setProfile((prev) => {
      const exists = prev.some((e) => e.allergenCode === allergenCode);
      if (exists) {
        return prev.filter((e) => e.allergenCode !== allergenCode);
      }
      const next: RestrictionEntry = { allergenCode, severity: 'preference' };
      return [...prev, next];
    });
  }, []);

  const setSeverity = useCallback((allergenCode: string, severity: SeverityLevel) => {
    setProfile((prev) =>
      prev.map((e) => (e.allergenCode === allergenCode ? { ...e, severity } : e))
    );
  }, []);

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <KeyboardAwareScreen>
    <View style={styles.container}>
      <Text style={styles.body}>
        Select your allergens/dietary restrictions and how strictly each must be honored. This
        stays on your device only.
      </Text>
      {profile.length + customRestrictions.length > 0 && (
        <Text style={styles.countBadgeText}>
          {profile.length + customRestrictions.length} restriction
          {profile.length + customRestrictions.length === 1 ? '' : 's'} set
        </Text>
      )}

      <TouchableOpacity
        style={styles.tagLegendHeader} accessibilityRole="button" accessibilityState={{ expanded: tagLegendExpanded }} aria-expanded={tagLegendExpanded}
        onPress={() => setTagLegendExpanded((v) => !v)}
      >
        <Text style={styles.tagLegendHeaderText}>What do the menu tags mean?</Text>
        <Ionicons
          name={tagLegendExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {tagLegendExpanded && (
        <View style={styles.tagLegendBody}>
          <Text style={styles.tagLegendIntro}>
            Each menu item is tagged per restriction, wherever a restaurant's data has been
            reviewed:
          </Text>
          {TAG_LEGEND_ORDER.map((status) => {
            const info = ALLERGEN_TAG_INFO[status];
            return (
              <View key={status} style={styles.tagLegendRow}>
                <View style={[styles.tagLegendDot, { backgroundColor: info.color }]} />
                <View style={styles.tagLegendTextBlock}>
                  <Text style={[styles.tagLegendLabel, { color: info.color }]}>{info.label}</Text>
                  <Text style={styles.tagLegendDescription}>{info.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FlatList
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        data={ALLERGENS}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <View style={[styles.card, styles.customCard]}>
            <Text style={styles.customTitle}>Anything else you avoid?</Text>
            <Text style={styles.customBody}>
              Add any food or ingredient, like beef or cilantro. Safe Bites flags menu items whose
              name or description mentions it. It can't catch ingredients a menu doesn't list, so
              these never count as confirmed safe.
            </Text>
            {customRestrictions.length > 0 && (
              <View style={styles.customChipRow}>
                {customRestrictions.map((keyword) => (
                  <TouchableOpacity accessibilityRole="button"
                    key={keyword}
                    style={styles.customChip}
                    onPress={() => removeCustomRestriction(keyword)}
                    accessibilityLabel={`Remove ${keyword}`}
                  >
                    <Text style={styles.customChipText}>{keyword}</Text>
                    <Ionicons name="close" size={14} color={colors.brandDark} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. beef"
                value={customInput}
                onChangeText={(text) => {
                  setCustomInput(text);
                  setCustomError(null);
                }}
                maxLength={MAX_CUSTOM_RESTRICTION_LENGTH}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={addCustomRestriction}
              />
              <TouchableOpacity
                style={[styles.customAddButton, !customInput.trim() && styles.customAddButtonDisabled]} accessibilityRole="button" accessibilityLabel="Add custom restriction"
                onPress={addCustomRestriction}
                disabled={!customInput.trim()}
              >
                <Text style={styles.customAddButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {customError && <Text style={styles.customError}>{customError}</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const entry = findEntry(item.code);
          const active = !!entry;
          const activeSeverity = SEVERITY_LEVELS.find((l) => l.value === entry?.severity);
          return (
            <View style={[styles.card, active && styles.cardActive]}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleAllergen(item.code)} accessibilityRole="checkbox" accessibilityState={{ checked: active }} aria-checked={active} accessibilityLabel={item.label}>
                <View
                  style={[
                    styles.checkbox,
                    active && { backgroundColor: activeSeverity?.color ?? colors.brand, borderColor: activeSeverity?.color ?? colors.brand },
                  ]}
                >
                  {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[styles.allergenLabel, active && styles.allergenLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
              {active && (
                <>
                  <View style={styles.severityRow}>
                    {SEVERITY_LEVELS.map((level) => {
                      const selected = entry?.severity === level.value;
                      return (
                        <TouchableOpacity
                          key={level.value}
                          style={[
                            styles.severityChip,
                            selected && { backgroundColor: level.color, borderColor: level.color },
                          ]}
                          onPress={() => setSeverity(item.code, level.value)} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} accessibilityLabel={`${item.label} severity: ${level.label}`}
                        >
                          <Text style={[styles.severityChipLabel, selected && styles.severityChipLabelSelected]}>
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {activeSeverity && (
                    <Text style={styles.severityDescription}>{activeSeverity.description}</Text>
                  )}
                </>
              )}
            </View>
          );
        }}
      />
    </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  body: {
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  countBadgeText: {
    color: colors.brandDark,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 14,
  },
  tagLegendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  tagLegendHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagLegendBody: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 12,
    marginTop: -6,
    marginBottom: 14,
  },
  tagLegendIntro: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  tagLegendRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tagLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  tagLegendTextBlock: {
    flex: 1,
  },
  tagLegendLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagLegendDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardActive: {
    borderColor: '#d3e3d3',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#c9cdc4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergenLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  allergenLabelActive: {
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginLeft: 36,
    gap: 8,
  },
  severityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  severityChipLabel: {
    fontSize: 13,
    color: '#3a3f37',
    fontWeight: '500',
  },
  severityChipLabelSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  customCard: {
    marginTop: 6,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  customChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#e6f0f3',
  },
  customChipText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '600',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.background,
  },
  customAddButton: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  customAddButtonDisabled: {
    opacity: 0.4,
  },
  customAddButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  customError: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  severityDescription: {
    marginTop: 8,
    marginLeft: 36,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
});
