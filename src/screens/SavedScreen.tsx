import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/types';
import { loadSaved, onSavedChanged, type SavedRestaurant } from '../lib/savedRestaurants';
import { computeSafetyStatus, fetchSafetyDataForRestaurants, type RestaurantSafetyData } from '../lib/safetyStatus';
import { loadProfile, type RestrictionProfile } from '../lib/profileStorage';
import { loadCustomRestrictions } from '../lib/customRestrictions';
import { onRestrictionsChanged } from '../lib/restrictionEvents';
import { itemCountLabel } from '../lib/itemCountLabel';
import { getCuisineEmoji, formatCuisineLabel } from '../lib/cuisineIcon';
import { colors } from '../navigation/theme';

/**
 * Saved restaurants, each re-scored against the diner's CURRENT restrictions
 * on every visit -- so "saved" never means a stale "safe". The personal note
 * is shown as the diner's own, separate from Safe Bites' verdict.
 */
export function SavedScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [saved, setSaved] = useState<SavedRestaurant[]>([]);
  const [safety, setSafety] = useState<Map<number, RestaurantSafetyData>>(new Map());
  const [profile, setProfile] = useState<RestrictionProfile>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyError, setSafetyError] = useState(false);

  const load = useCallback(async () => {
    const [list, loadedProfile, keywords] = await Promise.all([loadSaved(), loadProfile(), loadCustomRestrictions()]);
    setSaved(list);
    setProfile(loadedProfile);
    setCustomKeywords(keywords);
    setLoading(false);
    const brands = new Map(
      list.filter((r) => r.details?.brandWikidata).map((r) => [r.osmId, r.details?.brandWikidata as string] as [number, string])
    );
    try {
      setSafety(await fetchSafetyDataForRestaurants(list.map((r) => r.osmId), brands));
      setSafetyError(false);
    } catch {
      setSafetyError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useEffect(() => onSavedChanged(() => void load()), [load]);
  useEffect(() => onRestrictionsChanged(() => void load()), [load]);

  const open = (r: SavedRestaurant) =>
    navigation.navigate('SearchStack', {
      screen: 'RestaurantDetail',
      params: {
        osmId: r.osmId,
        restaurantName: r.restaurantName,
        lat: r.lat,
        lon: r.lon,
        phone: r.phone,
        address: r.address,
        cuisine: r.cuisine,
        details: r.details,
      },
    });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={saved}
      keyExtractor={(r) => String(r.osmId)}
      ListHeaderComponent={
        saved.length > 0 ? (
          <Text style={styles.intro}>
            Checked against your current restrictions every time you open this tab.
            {safetyError ? ' Safety data could not be loaded right now.' : ''}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={40} color="#c3c9bf" />
          <Text style={styles.emptyTitle}>No saved restaurants yet</Text>
          <Text style={styles.emptyText}>
            Tap the bookmark on any restaurant page to keep track of favorites and places that work for you.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const data = safety.get(item.osmId);
        const status = data ? computeSafetyStatus(data.menuItems, profile) : 'no-data';
        const count = data ? itemCountLabel(data.menuItems, [], profile, customKeywords) : null;
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => open(item)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.restaurantName}, ${status === 'no-data' ? 'no safety data yet' : status}`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{getCuisineEmoji(item.cuisine)}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.restaurantName}
                </Text>
                <StatusPill status={status} />
              </View>
              {item.cuisine && <Text style={styles.meta}>{formatCuisineLabel(item.cuisine)}</Text>}
              {item.address && (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.address}
                </Text>
              )}
              {count && <Text style={styles.count}>{count}</Text>}
              {item.note && (
                <View style={styles.noteRow}>
                  <Ionicons name="create-outline" size={13} color={colors.brandDark} />
                  <Text style={styles.noteText} numberOfLines={2}>
                    <Text style={styles.noteLabel}>Your note: </Text>
                    {item.note}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function StatusPill({ status }: { status: 'safe' | 'unsafe' | 'no-data' }) {
  const config = {
    safe: { label: 'Safe', color: colors.safe, bg: '#e7f2ec' },
    unsafe: { label: 'Unsafe', color: colors.unsafe, bg: '#faf0e6' },
    'no-data': { label: 'No data yet', color: colors.noData, bg: '#f0f0f0' },
  }[status];
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[styles.pillText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 10 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  intro: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptyText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  cardBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { color: colors.textSecondary, fontSize: 13 },
  count: { color: colors.brandDark, fontSize: 13, fontWeight: '600', marginTop: 2 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#eef4f6',
    borderRadius: 8,
    padding: 8,
  },
  noteText: { flex: 1, color: colors.brandDark, fontSize: 13, lineHeight: 18 },
  noteLabel: { fontWeight: '700' },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontSize: 12, fontWeight: '700' },
});
