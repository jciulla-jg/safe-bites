import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SearchStackParamList } from '../navigation/types';
import {
  distanceMiles,
  geocodeZip,
  OsmError,
  type GeocodeResult,
  milesToMeters,
  nameMatches,
  searchNearbyRestaurants,
  type OsmRestaurant,
} from '../lib/osm';
import {
  computeSafetyStatus,
  fetchSafetyDataForRestaurants,
  type MenuItemWithTags,
  type SafetyStatus,
} from '../lib/safetyStatus';
import { fetchRatingsSummaries, formatRatingsSummary, type RatingsSummary } from '../lib/ratingsSummary';
import { loadProfile, type RestrictionProfile } from '../lib/profileStorage';
import { ALLERGENS } from '../data/allergens';
import { loadCustomRestrictions } from '../lib/customRestrictions';
import { onRestrictionsChanged } from '../lib/restrictionEvents';
import { getCuisineEmoji, formatCuisineLabel, cuisineTokens } from '../lib/cuisineIcon';
import { shortDescription } from '../lib/restaurantDescription';
import { loadLastSearch, saveLastSearch } from '../lib/lastSearch';
import { clearRecentlyViewed, loadRecentlyViewed, type RecentRestaurant } from '../lib/recentlyViewed';
import { KeyboardAwareScreen } from '../components/KeyboardAwareScreen';
import { fetchCommunityMenuItemsForRestaurants, type CommunityMenuItem } from '../lib/communityMenu';
import { loadReportedIds } from '../lib/reports';
import { itemCountLabel } from '../lib/itemCountLabel';
import {
  loadCachedGeocode,
  loadCachedResults,
  resultsKey,
  saveCachedGeocode,
  saveCachedResults,
} from '../lib/searchCache';
import { colors } from '../navigation/theme';

// Above this viewport width (web only -- native screens are always
// phone-width) the content column is capped and centered rather than
// stretching edge-to-edge across a desktop browser.
const WIDE_LAYOUT_BREAKPOINT = 700;
const WIDE_LAYOUT_MAX_WIDTH = 640;

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const RADIUS_OPTIONS_MILES = [1, 5, 10, 25];
const DEFAULT_RADIUS_MILES = 5;

/**
 * Safety-status filter for the results list -- applies only to restaurants
 * that HAVE seeded data ('safe'/'unsafe'). Whether "no data yet" restaurants
 * show at all is a separate, independent toggle (showNoData below), not a
 * 4th option here -- mixing "what's the safety verdict" with "do you even
 * have data" into one control was confusing (Safe+Unsafe vs Show All read
 * as the same thing).
 */
type ResultFilter = 'safe' | 'unsafe' | 'all';

const FILTER_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: 'safe', label: 'Safe' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'all', label: 'All' },
];

/** Minimum average (accuracy+accommodation)/2 rating; 0 means no rating filter applied. */
const RATING_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

type SortBy = 'default' | 'distance' | 'rating' | 'alphabetical';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating' },
  { value: 'alphabetical', label: 'A-Z' },
];

/**
 * A search result as fetched. Seeded menu data is kept raw (not pre-scored),
 * so Safe/Unsafe and safe-item counts can be recomputed instantly when the
 * "Safe for" allergen filter changes, without another network round trip.
 */
interface ResultRow {
  restaurant: OsmRestaurant;
  ratingsSummary?: RatingsSummary;
  /** Undefined when the restaurant has no seeded safety data ("no data yet"). */
  menuItems?: MenuItemWithTags[];
  /** Diner-submitted items (unverified); counted in the tile line, never in the verdict. */
  communityItems?: CommunityMenuItem[];
}

/** A result scored against the restrictions currently being checked. */
interface ScoredRow extends ResultRow {
  status: SafetyStatus;
  /** "N of M items safe for you" (community items called out), or null with no items. */
  countLabel: string | null;
}

type SearchMode = 'nearby' | 'name';

export function SearchScreen({ navigation }: Props) {
  const [zip, setZip] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [filter, setFilter] = useState<ResultFilter>('all');
  // Visible by default -- a diner should see the full picture, including
  // what hasn't been reviewed yet, unless they choose to narrow it down.
  const [showNoData, setShowNoData] = useState(true);
  // Only restaurants with diner-added menu items (unverified), e.g. to help fill gaps.
  const [onlyCommunity, setOnlyCommunity] = useState(false);
  // Multi-select: empty array means "all cuisines", matching the same
  // "no filter" convention as the other controls.
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [cuisinePickerOpen, setCuisinePickerOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  // Expanded by default so radius/safety are visible before the first
  // search; auto-collapses once results land to give the list more room,
  // but the user can always re-expand via the Filters header.
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [profile, setProfile] = useState<RestrictionProfile>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lon: number } | null>(null);
  // Set when the live map search failed and saved results are shown instead.
  const [savedResultsAt, setSavedResultsAt] = useState<number | null>(null);
  const [recents, setRecents] = useState<RecentRestaurant[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [nameQuery, setNameQuery] = useState('');
  // The name the current results were searched by (null for a nearby search).
  const [searchedName, setSearchedName] = useState<string | null>(null);
  // Allergens the "Safe for" filter checks this search. null = follow the
  // saved profile; a list = a temporary override (e.g. dining with a friend)
  // that never touches the saved profile.
  const [checkAllergens, setCheckAllergens] = useState<string[] | null>(null);
  // What the current results were fetched for; pull-to-refresh re-runs
  // this, not whatever the user has since typed into the boxes.
  const searchedRef = useRef<{ zip: string; name: string | null } | null>(null);

  // Prefill zip/radius from the last search on first mount, so reopening
  // the app doesn't start from a totally blank form. Never overwrites a
  // value the user has already typed or tapped before storage resolved.
  useEffect(() => {
    loadLastSearch().then((last) => {
      if (!last) return;
      setZip((current) => (current ? current : last.zip));
      if (RADIUS_OPTIONS_MILES.includes(last.radiusMiles)) {
        setRadiusMiles((current) => (current === DEFAULT_RADIUS_MILES ? last.radiusMiles : current));
      }
    });
  }, []);

  // Recently-viewed restaurants refresh every time this screen regains
  // focus, so a restaurant opened from a search updates the list
  // immediately on the way back.
  useFocusEffect(
    useCallback(() => {
      loadRecentlyViewed().then(setRecents);
    }, [])
  );

  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === 'web' && width >= WIDE_LAYOUT_BREAKPOINT;

  // Reload the on-device restriction profile every time this screen gains
  // focus, so edits made on the Profile tab are reflected in the next
  // safety-status computation without requiring the app to restart.
  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
      loadCustomRestrictions().then(setCustomKeywords);
    }, [])
  );

  // Results are scored at render time from these, so reloading them
  // re-scores the current results instantly -- no new search needed.
  useEffect(
    () =>
      onRestrictionsChanged(() => {
        loadProfile().then(setProfile);
        loadCustomRestrictions().then(setCustomKeywords);
      }),
    []
  );

  /** Core search logic shared by the Search button and pull-to-refresh. */
  async function performSearch(trimmedZip: string, name: string | null): Promise<void> {
    // Live lookups first; if a free OSM service is down or busy, fall back to
    // this device's saved results for the same zip and radius.
    const isTransient = (err: unknown) => err instanceof OsmError && err.transient;
    let geo: GeocodeResult;
    try {
      geo = await geocodeZip(trimmedZip);
      saveCachedGeocode(trimmedZip, geo).catch(() => {});
    } catch (err) {
      const cachedGeo = isTransient(err) ? await loadCachedGeocode(trimmedZip) : null;
      if (!cachedGeo) throw err;
      geo = cachedGeo;
    }
    const { lat, lon, locationLabel: geocodedLabel } = geo;
    setLocationLabel(geocodedLabel ?? null);
    setSearchCenter({ lat, lon });
    const cacheKey = resultsKey(trimmedZip, radiusMiles);
    let found: OsmRestaurant[];
    try {
      found = await searchNearbyRestaurants(lat, lon, milesToMeters(radiusMiles));
      saveCachedResults(cacheKey, found).catch(() => {});
      setSavedResultsAt(null);
    } catch (err) {
      const cached = isTransient(err) ? await loadCachedResults(cacheKey) : null;
      if (!cached) throw err;
      found = cached.restaurants;
      setSavedResultsAt(cached.savedAt);
    }
    // Name matching happens before the per-restaurant safety lookups below,
    // so a name search only queries Supabase for the matches.
    const nearby = name ? found.filter((restaurant) => nameMatches(restaurant.name, name)) : found;
    setSearchedName(name);

    if (nearby.length === 0) {
      setResults([]);
      return;
    }

    // Ratings and safety data are each fetched in batched queries across the
    // whole result set, not one request per restaurant.
    const osmIds = nearby.map((restaurant) => restaurant.osmId);
    const [ratingsByOsmId, safetyByOsmId, communityByOsmId, reportedIds] = await Promise.all([
      fetchRatingsSummaries(osmIds),
      // If the Supabase lookup fails, still show the OSM results -- every row
      // just reads "no data yet" rather than failing the whole search.
      fetchSafetyDataForRestaurants(
        osmIds,
        new Map(
          nearby
            .filter((r) => r.details.brandWikidata)
            .map((r) => [r.osmId, r.details.brandWikidata as string] as [number, string])
        )
      ).catch(() => new Map()),
      fetchCommunityMenuItemsForRestaurants(osmIds).catch(() => new Map<number, CommunityMenuItem[]>()),
      loadReportedIds(),
    ]);

    setResults(
      nearby.map((restaurant) => ({
        restaurant,
        menuItems: safetyByOsmId.get(restaurant.osmId)?.menuItems,
        communityItems: communityByOsmId.get(restaurant.osmId)?.filter((item) => !reportedIds.has(item.id)),
        ratingsSummary: ratingsByOsmId.get(restaurant.osmId),
      }))
    );
  }

  async function handleSearch() {
    const trimmedZip = zip.trim();
    const trimmedName = searchMode === 'name' ? nameQuery.trim() : '';
    if (searchMode === 'name' && !trimmedName) {
      setError('Enter a restaurant name to search for.');
      return;
    }
    if (!trimmedZip) {
      setError(searchMode === 'name' ? 'Enter a zip code to search near.' : 'Enter a zip code to search.');
      return;
    }
    if (!/^\d{5}$/.test(trimmedZip)) {
      setError('Enter a 5-digit US zip code, like 12305.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setLocationLabel(null);
    setSelectedCuisines([]); // available cuisines depend on the new result set

    setNameFilter('');

    try {
      await performSearch(trimmedZip, trimmedName || null);
      searchedRef.current = { zip: trimmedZip, name: trimmedName || null };
      setFiltersExpanded(false); // reclaim screen space for the results the user just asked for
      saveLastSearch({ zip: trimmedZip, radiusMiles }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /** Pull-to-refresh: re-runs the same search in place, no full-screen loading state. */
  async function handleRefresh() {
    const searched = searchedRef.current;
    if (!searched || refreshing || loading) return;

    setRefreshing(true);
    setError(null);
    setSelectedCuisines([]); // the cuisine list is rebuilt from the fresh result set
    try {
      await performSearch(searched.zip, searched.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }

  const displayLocation = locationLabel ?? zip;

  // Cuisines actually present in the current result set -- the chip row is
  // built from real data, not a fixed static list, so it never offers a
  // cuisine with zero matching results.
  const availableCuisines = Array.from(
    new Set((results ?? []).flatMap((row) => cuisineTokens(row.restaurant.cuisine)))
  ).sort();

  // The restrictions actually being checked: the saved profile, or the
  // "Safe for" override. Allergens added only in the override are checked at
  // Allergy strictness; profile allergens keep their saved severity.
  const effectiveRestrictions: RestrictionProfile =
    checkAllergens === null
      ? profile
      : checkAllergens.map(
          (code) => profile.find((entry) => entry.allergenCode === code) ?? { allergenCode: code, severity: 'allergy' }
        );
  const checkedCodes = effectiveRestrictions.map((entry) => entry.allergenCode);
  const overrideActive =
    checkAllergens !== null &&
    (checkAllergens.length !== profile.length ||
      checkAllergens.some((code) => !profile.some((entry) => entry.allergenCode === code)));

  function toggleCheckAllergen(code: string) {
    const current = checkAllergens ?? profile.map((entry) => entry.allergenCode);
    setCheckAllergens(current.includes(code) ? current.filter((c) => c !== code) : [...current, code]);
  }

  const scoredRows: ScoredRow[] = (results ?? []).map((row) => ({
    ...row,
    status: row.menuItems ? computeSafetyStatus(row.menuItems, effectiveRestrictions) : 'no-data',
    countLabel: itemCountLabel(row.menuItems, row.communityItems, effectiveRestrictions, customKeywords),
  }));

  const trimmedNameFilter = nameFilter.trim().toLowerCase();
  const visibleRows = scoredRows.filter((row) => {
    if (!matchesName(row, trimmedNameFilter)) return false;
    if (!matchesCuisine(row, selectedCuisines)) return false;
    if (!matchesRating(row, minRating)) return false;
    if (onlyCommunity && !(row.communityItems && row.communityItems.length > 0)) return false;

    // "No data yet" rows are governed solely by the showNoData toggle --
    // they're neither safe nor unsafe, so the Safe/Unsafe/All filter below
    // doesn't apply to them at all.
    if (row.status === 'no-data') {
      return showNoData;
    }

    return filter === 'all' ? true : row.status === filter;
  });

  const sortedRows = [...visibleRows].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.restaurant.name.localeCompare(b.restaurant.name);
      case 'rating': {
        const overallOf = (row: ResultRow) =>
          row.ratingsSummary ? (row.ratingsSummary.avgAccuracy + row.ratingsSummary.avgAccommodation) / 2 : -1;
        return overallOf(b) - overallOf(a); // unrated (-1) sink to the bottom
      }
      case 'distance': {
        if (!searchCenter) return 0;
        const distOf = (row: ResultRow) =>
          distanceMiles(searchCenter.lat, searchCenter.lon, row.restaurant.lat, row.restaurant.lon);
        return distOf(a) - distOf(b);
      }
      default:
        return 0; // preserve Overpass's original order
    }
  });

  function matchesName(row: ResultRow, trimmed: string): boolean {
    return !trimmed || row.restaurant.name.toLowerCase().includes(trimmed);
  }

  function matchesCuisine(row: ResultRow, selected: string[]): boolean {
    if (selected.length === 0) return true;
    const tokens = cuisineTokens(row.restaurant.cuisine);
    return selected.some((c) => tokens.includes(c));
  }

  function toggleCuisine(cuisine: string) {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  }

  function matchesRating(row: ResultRow, minimum: number): boolean {
    if (minimum === 0) return true;
    if (!row.ratingsSummary) return false;
    const overall = (row.ratingsSummary.avgAccuracy + row.ratingsSummary.avgAccommodation) / 2;
    return overall >= minimum;
  }

  // How many filters differ from their default -- shown on the collapsed
  // "Filters" header so it's not a total mystery what's hiding under there.
  const activeFilterCount =
    (filter !== 'all' ? 1 : 0) +
    (!showNoData ? 1 : 0) +
    (onlyCommunity ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedCuisines.length > 0 ? 1 : 0) +
    (overrideActive ? 1 : 0);

  // Everything above the results themselves (search bar, filters, empty
  // state, status messages) used to sit in a plain View above the FlatList,
  // which only the list itself scrolled internally -- when filters were
  // expanded plus a few "recently viewed" rows exceeded one screen's height,
  // the overflow had nowhere to scroll to and just clipped past the
  // container's painted background. Folding it all into the FlatList's own
  // header makes the FlatList's scroll own the whole screen instead, so
  // arbitrarily tall header content is always reachable.
  // Shown on the empty state, and after a failed search as a way back in.
  const recentsBlock =
    recents.length > 0 ? (
      <View style={styles.recentsSection}>
        <View style={styles.recentsHeaderRow}>
          <Text style={styles.sectionLabel}>Recently viewed</Text>
          <TouchableOpacity
            onPress={() => {
              setRecents([]);
              clearRecentlyViewed().catch(() => {});
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear recently viewed restaurants"
          >
            <Text style={styles.recentsClear}>Clear</Text>
          </TouchableOpacity>
        </View>
        {recents.map((recent) => (
          <TouchableOpacity
            key={recent.osmId}
            style={styles.recentRow} accessibilityRole="button" accessibilityLabel={`Open ${recent.restaurantName}`}
            onPress={() =>
              navigation.navigate('RestaurantDetail', {
                osmId: recent.osmId,
                restaurantName: recent.restaurantName,
                lat: recent.lat,
                lon: recent.lon,
                phone: recent.phone,
                address: recent.address,
                cuisine: recent.cuisine,
                details: recent.details,
              })
            }
          >
            <View style={styles.cuisineAvatarSmall}>
              <Text style={styles.cuisineAvatarEmojiSmall}>
                {getCuisineEmoji(recent.cuisine)}
              </Text>
            </View>
            <Text style={styles.recentRowText} numberOfLines={1}>
              {recent.restaurantName}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    ) : null;

  const listHeader = (
    <>
      <View style={styles.modeToggle}>
        {(['nearby', 'name'] as SearchMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeOption, searchMode === mode && styles.modeOptionSelected]} accessibilityRole="button" accessibilityState={{ selected: searchMode === mode }} aria-selected={searchMode === mode}
            onPress={() => {
              setSearchMode(mode);
              setError(null);
            }}
          >
            <Ionicons
              name={mode === 'nearby' ? 'location-outline' : 'search-outline'}
              size={14}
              color={searchMode === mode ? '#fff' : colors.textSecondary}
            />
            <Text style={[styles.modeOptionText, searchMode === mode && styles.modeOptionTextSelected]}>
              {mode === 'nearby' ? 'Nearby' : 'By name'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {searchMode === 'name' && (
        <TextInput
          style={styles.restaurantNameInput}
          placeholder="Restaurant name, e.g. Pho Queen"
          value={nameQuery}
          onChangeText={setNameQuery}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      )}

      <View style={styles.formRow}>
        <TextInput
          style={styles.zipInput}
          placeholder={searchMode === 'name' ? 'Near zip code' : 'Zip code'}
          value={zip}
          onChangeText={setZip}
          keyboardType="number-pad"
          maxLength={10}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading || refreshing} accessibilityRole="button" accessibilityLabel={loading ? "Searching" : "Search"}>
          <Text style={styles.searchButtonText}>{loading ? 'Searching...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {results !== null && results.length > 0 && searchedName === null && (
        <TextInput
          style={styles.nameFilterInput}
          placeholder="Narrow these results by name"
          value={nameFilter}
          onChangeText={setNameFilter}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      )}

      <TouchableOpacity
        style={styles.filtersHeaderRow} accessibilityRole="button" accessibilityState={{ expanded: filtersExpanded }} aria-expanded={filtersExpanded} accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
        onPress={() => setFiltersExpanded((v) => !v)}
      >
        <View style={styles.filtersHeaderLeft}>
          <Text style={styles.filtersHeaderText}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {filtersExpanded && (
        <View style={styles.filtersPanel}>
          <FilterRow label="Radius">
            {RADIUS_OPTIONS_MILES.map((miles) => (
              <Chip key={miles} label={`${miles} mi`} selected={radiusMiles === miles} onPress={() => setRadiusMiles(miles)} />
            ))}
          </FilterRow>

          <FilterRow label="Safe for">
            {ALLERGENS.map((allergen) => (
              <Chip
                key={allergen.code}
                label={allergen.label}
                selected={checkedCodes.includes(allergen.code)}
                onPress={() => toggleCheckAllergen(allergen.code)}
              />
            ))}
          </FilterRow>
          {overrideActive ? (
            <View style={styles.filterHintRow}>
              <Text style={styles.filterHint}>Checking these for this search only — your profile is unchanged.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => setCheckAllergens(null)}>
                <Text style={styles.filterHintAction}>Reset to profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            checkedCodes.length === 0 && (
              <Text style={[styles.filterHint, styles.filterHintRow]}>
                Tap allergens to check, or set them up in your Profile.
              </Text>
            )
          )}

          <FilterRow label="Safety">
            {FILTER_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={filter === opt.value} onPress={() => setFilter(opt.value)} />
            ))}
            <Chip
              label="No data yet"
              icon={showNoData ? 'checkbox' : 'square-outline'}
              selected={false}
              onPress={() => setShowNoData((v) => !v)}
            />
            <Chip
              label="Has community items"
              icon={onlyCommunity ? 'checkbox' : 'square-outline'}
              selected={false}
              onPress={() => setOnlyCommunity((v) => !v)}
            />
          </FilterRow>

          <FilterRow label="Rating">
            {RATING_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={minRating === opt.value} onPress={() => setMinRating(opt.value)} />
            ))}
          </FilterRow>

          {availableCuisines.length > 1 && (
            <FilterRow label="Cuisine">
              <Chip
                label={
                  selectedCuisines.length === 0
                    ? 'All cuisines'
                    : selectedCuisines.length === 1
                      ? formatCuisineLabel(selectedCuisines[0])
                      : `${selectedCuisines.length} cuisines`
                }
                icon="chevron-down"
                iconAfter
                selected={selectedCuisines.length > 0}
                onPress={() => setCuisinePickerOpen(true)}
              />
            </FilterRow>
          )}

          <FilterRow label="Sort">
            {SORT_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={sortBy === opt.value} onPress={() => setSortBy(opt.value)} />
            ))}
          </FilterRow>
        </View>
      )}

      {!loading && !error && results === null && (
        <>
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={40} color="#c3c9bf" />
            <Text style={styles.emptyStateText}>
              Enter a zip code above to find restaurants near you, with menu items checked
              against your restriction profile.
            </Text>
          </View>

          {recentsBlock}
        </>
      )}

      {loading && (
        <View style={styles.centeredBlock}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.body}>Looking up restaurants near {displayLocation}...</Text>
        </View>
      )}

      {!loading && error && (
        <>
          <View style={styles.centeredBlock}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSearch} accessibilityRole="button">
              <Ionicons name="refresh" size={15} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
          {recentsBlock}
        </>
      )}

      {!loading && !error && results !== null && savedResultsAt !== null && (
        <View style={styles.savedNotice} accessibilityRole="alert">
          <Ionicons name="cloud-offline-outline" size={15} color={colors.brandDark} />
          <Text style={styles.savedNoticeText}>
            The live map search is busy right now, so these are your saved results from{' '}
            {new Date(savedResultsAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            . Safety data is current. Pull down or tap Search to try again.
          </Text>
        </View>
      )}

      {!loading && !error && results !== null && results.length === 0 && (
        <View style={styles.centeredBlock}>
          <Text style={styles.body}>
            {searchedName
              ? `No restaurants named "${searchedName}" found within ${radiusMiles} miles of ${displayLocation}. Try a wider radius or part of the name.`
              : `No restaurants found near ${displayLocation} within ${radiusMiles} miles.`}
          </Text>
        </View>
      )}

      {!loading && !error && results !== null && results.length > 0 && visibleRows.length === 0 && (
        <View style={styles.centeredBlock}>
          <Text style={styles.body}>
            {trimmedNameFilter
              ? `No restaurants match "${nameFilter.trim()}" with the current filters.`
              : `No restaurants match the current filters. Try "All" or turning on "no data yet" restaurants.`}
          </Text>
        </View>
      )}

      {!loading && !error && results !== null && results.length > 0 && effectiveRestrictions.length === 0 && (
        <TouchableOpacity
          style={styles.profileNudge} accessibilityRole="button" accessibilityLabel="Set up your restriction profile"
          onPress={() => navigation.getParent()?.navigate('Profile' as never)}
        >
          <Ionicons name="person-circle-outline" size={22} color={colors.brand} />
          <View style={styles.profileNudgeTextBlock}>
            <Text style={styles.profileNudgeTitle}>Set up your restriction profile</Text>
            <Text style={styles.profileNudgeBody}>
              Add your allergens so Safe/Unsafe reflects what's actually safe for you.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.brand} />
        </TouchableOpacity>
      )}

      {!loading && !error && results !== null && results.length > 0 && sortedRows.length > 0 && (
        <Text style={styles.resultCountText}>
          {sortedRows.length === results.length
            ? `${results.length} restaurant${results.length === 1 ? '' : 's'}${searchedName ? ` matching "${searchedName}"` : ''}`
            : `Showing ${sortedRows.length} of ${results.length} restaurants`}
        </Text>
      )}
    </>
  );

  return (
    <KeyboardAwareScreen>
    <View style={styles.screen}>
      <View style={[styles.container, isWideLayout && styles.containerWide]}>
        {availableCuisines.length > 1 && (
          <Modal
            visible={cuisinePickerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setCuisinePickerOpen(false)}
          >
            <TouchableOpacity accessibilityRole="button"
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCuisinePickerOpen(false)}
            >
              <TouchableOpacity accessibilityRole="button" activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Cuisine</Text>
                  {selectedCuisines.length > 0 && (
                    <TouchableOpacity accessibilityRole="button" onPress={() => setSelectedCuisines([])}>
                      <Text style={styles.modalClearText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {availableCuisines.map((cuisine) => {
                    const checked = selectedCuisines.includes(cuisine);
                    return (
                      <TouchableOpacity
                        key={cuisine}
                        style={styles.modalRow} accessibilityRole="checkbox" accessibilityState={{ checked: selectedCuisines.includes(cuisine) }} aria-checked={selectedCuisines.includes(cuisine)}
                        onPress={() => toggleCuisine(cuisine)}
                      >
                        <Ionicons
                          name={checked ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={checked ? colors.brand : '#9a9f92'}
                        />
                        <Text style={styles.modalRowText}>{formatCuisineLabel(cuisine)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity accessibilityRole="button"
                  style={styles.modalDoneButton}
                  onPress={() => setCuisinePickerOpen(false)}
                >
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}

        <FlatList
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          data={sortedRows}
          keyExtractor={(row) => String(row.restaurant.osmId)}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={results !== null ? handleRefresh : undefined}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard} accessibilityRole="button" accessibilityLabel={`${item.restaurant.name}, ${item.status === "no-data" ? "no safety data yet" : item.status === "safe" ? "safe" : "unsafe"}${item.countLabel ? `, ${item.countLabel}` : ""}`}
              onPress={() =>
                navigation.navigate('RestaurantDetail', {
                  osmId: item.restaurant.osmId,
                  restaurantName: item.restaurant.name,
                  lat: item.restaurant.lat,
                  lon: item.restaurant.lon,
                  phone: item.restaurant.phone,
                  address: item.restaurant.address,
                  cuisine: item.restaurant.cuisine,
                  details: item.restaurant.details,
                  restrictionsOverride: overrideActive ? effectiveRestrictions : undefined,
                })
              }
            >
              <View style={styles.resultRow}>
                <View style={styles.cuisineAvatar}>
                  <Text style={styles.cuisineAvatarEmoji}>{getCuisineEmoji(item.restaurant.cuisine)}</Text>
                </View>
                <View style={styles.resultBody}>
                  <View style={styles.resultHeaderRow}>
                    <Text style={styles.resultName}>{item.restaurant.name}</Text>
                    <SafetyBadge status={item.status} />
                  </View>
                  <Text style={styles.resultDescription} numberOfLines={1}>
                    {shortDescription(item.restaurant.cuisine, item.restaurant.details)}
                  </Text>
                  {item.restaurant.address && (
                    <Text style={styles.resultAddress}>{item.restaurant.address}</Text>
                  )}
                  <View style={styles.resultMetaRow}>
                    {searchCenter && (
                      <Text style={styles.resultDistance}>
                        {distanceMiles(
                          searchCenter.lat,
                          searchCenter.lon,
                          item.restaurant.lat,
                          item.restaurant.lon
                        ).toFixed(1)}{' '}
                        mi away
                      </Text>
                    )}
                    {item.countLabel && <Text style={styles.resultSafeCount}>{item.countLabel}</Text>}
                    {item.ratingsSummary && (
                      <Text style={styles.resultRatings}>{formatRatingsSummary(item.ratingsSummary)}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
    </KeyboardAwareScreen>
  );
}

/**
 * One compact filter: fixed-width label, then chips that scroll sideways if
 * they don't fit. When chips are cut off, a faded edge with a chevron shows
 * on that side so it's obvious the row scrolls.
 */
function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  const [viewWidth, setViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const moreLeft = offsetX > 4;
  const moreRight = contentWidth - viewWidth - offsetX > 4;
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterRowLabel}>{label}</Text>
      <View style={styles.filterRowScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRowChips}
          onLayout={(e) => setViewWidth(e.nativeEvent.layout.width)}
          onContentSizeChange={(w) => setContentWidth(w)}
          onScroll={(e) => setOffsetX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={32}
        >
          {children}
        </ScrollView>
        {moreLeft && <ScrollHint side="left" />}
        {moreRight && <ScrollHint side="right" />}
      </View>
    </View>
  );
}

/** Faded edge + chevron over a sideways-scrolling row (no gradient library needed). */
function ScrollHint({ side }: { side: 'left' | 'right' }) {
  const steps = [0.35, 0.7, 0.95];
  const bands = steps.map((opacity) => (
    <View key={opacity} style={[styles.scrollHintBand, { opacity }]} />
  ));
  return (
    <View
      style={[styles.scrollHint, side === 'right' ? { right: 0 } : { left: 0, flexDirection: 'row-reverse' }]}
    >
      {bands}
      <View style={styles.scrollHintIcon}>
        <Ionicons
          name={side === 'right' ? 'chevron-forward' : 'chevron-back'}
          size={16}
          color={colors.brand}
        />
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  icon,
  iconAfter,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconAfter?: boolean;
}) {
  const iconEl = icon && <Ionicons name={icon} size={14} color={selected ? '#fff' : colors.brand} />;
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} aria-selected={selected}>
      {!iconAfter && iconEl}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {iconAfter && iconEl}
    </TouchableOpacity>
  );
}

function SafetyBadge({ status }: { status: SafetyStatus }) {
  const config: Record<SafetyStatus, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    safe: { label: 'Safe', color: colors.safe, bg: '#e7f2ec', icon: 'checkmark-circle' },
    unsafe: { label: 'Unsafe w/ disclaimer', color: colors.unsafe, bg: '#faf0e6', icon: 'alert-circle' },
    'no-data': { label: 'No data yet', color: colors.noData, bg: '#f0f0ee', icon: 'help-circle-outline' },
  };
  const { label, color, bg, icon } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
    backgroundColor: colors.background,
  },
  containerWide: {
    maxWidth: WIDE_LAYOUT_MAX_WIDTH,
    alignSelf: 'center',
  },
  body: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  zipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
    backgroundColor: colors.card,
  },
  nameFilterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
    marginBottom: 14,
    backgroundColor: colors.card,
  },
  searchButton: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  filtersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtersHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filtersBadge: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a7f76',
    marginBottom: 8,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 3,
    marginTop: 2,
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  modeOptionSelected: {
    backgroundColor: colors.brand,
  },
  modeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeOptionTextSelected: {
    color: '#fff',
  },
  restaurantNameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  filtersPanel: {
    marginBottom: 10,
  },
  savedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#e7f0f3',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  savedNoticeText: {
    flex: 1,
    color: colors.brandDark,
    fontSize: 12,
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterRowLabel: {
    width: 70,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '700',
    color: '#7a7f76',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterRowScroll: {
    flex: 1,
  },
  filterRowChips: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 28,
  },
  scrollHint: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  scrollHintBand: {
    width: 6,
    backgroundColor: colors.background,
  },
  scrollHintIcon: {
    width: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterHintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    marginLeft: 70,
    marginTop: -2,
    marginBottom: 8,
  },
  filterHint: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  filterHintAction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 11,
    minHeight: 30,
    backgroundColor: colors.card,
  },
  chipText: {
    color: '#3a3f37',
    fontSize: 12,
    fontWeight: '500',
  },
  chipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClearText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  modalRowText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalDoneButton: {
    marginTop: 12,
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  centeredBlock: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontSize: 14,
    maxWidth: 280,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  profileNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  profileNudgeTextBlock: {
    flex: 1,
  },
  profileNudgeTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  profileNudgeBody: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  resultDistance: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  resultCountText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  recentsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentsClear: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  recentsSection: {
    marginTop: 24,
    width: '100%',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  cuisineAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cuisineAvatarEmojiSmall: {
    fontSize: 15,
  },
  recentRowText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cuisineAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cuisineAvatarEmoji: {
    fontSize: 20,
  },
  resultBody: {
    flex: 1,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  resultDescription: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  resultAddress: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  resultMetaRow: {
    marginTop: 6,
    gap: 2,
  },
  resultSafeCount: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: '600',
  },
  resultRatings: {
    color: colors.rating,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
