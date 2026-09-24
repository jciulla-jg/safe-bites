import { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SearchStackParamList } from '../navigation/types';
import { RatingsSection } from '../components/RatingsSection';
import { MenuItemFeedback } from '../components/MenuItemFeedback';
import { CommunityMenuSection } from '../components/CommunityMenuSection';
import { MentionBadge } from '../components/MentionBadge';
import {
  computeSafetyStatus,
  explainUnsafe,
  fetchRestaurantSafetyData,
  itemIsSafeForProfile,
  labelForItemAllergen,
  type ItemAllergenLabel,
  type MenuItemWithTags,
  type RestaurantSafetyData,
  type Verification,
} from '../lib/safetyStatus';
import { loadProfile, type RestrictionProfile } from '../lib/profileStorage';
import { fetchRatingsSummaries, formatRatingsSummary, type RatingsSummary } from '../lib/ratingsSummary';
import { fetchFeedbackForMenuItems, type MenuItemFeedbackEntry } from '../lib/menuItemFeedback';
import { ALLERGENS } from '../data/allergens';
import { ALLERGEN_TAG_INFO } from '../data/allergenTagInfo';
import { KeyboardAwareScreen } from '../components/KeyboardAwareScreen';
import type { CommunityMenuItem } from '../lib/communityMenu';
import { itemCountLabel } from '../lib/itemCountLabel';
import { ReviewRequestButton } from '../components/ReviewRequestButton';
import { colors } from '../navigation/theme';
import { getCuisineEmoji } from '../lib/cuisineIcon';
import type { RestaurantDetails } from '../lib/osm';
import {
  dietLabel,
  formatCuisineList,
  formatOpeningHours,
  hasAnyDetails,
  serviceLabels,
} from '../lib/restaurantDescription';
import { recordRecentlyViewed } from '../lib/recentlyViewed';
import { loadCustomRestrictions } from '../lib/customRestrictions';
import { itemMentions } from '../lib/mentions';
import { onRestrictionsChanged } from '../lib/restrictionEvents';

type Props = NativeStackScreenProps<SearchStackParamList, 'RestaurantDetail'>;

// Matches SearchScreen's breakpoint/cap so the two screens feel consistent
// when demoed side-by-side in a desktop browser via `expo start --web`.
const WIDE_LAYOUT_BREAKPOINT = 700;
const WIDE_LAYOUT_MAX_WIDTH = 640;

/**
 * RestaurantDetailScreen -- menu-item safety display (SB-3) plus
 * directions/contact info (SB-4). Menu/allergen data comes from the
 * `restaurants` / `menu_items` / `menu_item_allergen_tags` tables when
 * seeded, matched to the live OSM result via `osm_id`; unseeded restaurants
 * show a "no safety data yet" state (ADR-0002's hybrid data-sourcing
 * decision).
 *
 * lat/lon/phone/address arrive as optional route params passed through from
 * the search results (SearchScreen) so this screen doesn't need a second
 * OSM round-trip -- see ADR-0002 / D3 packet, option (b).
 *
 * The <RatingsSection /> below is D4's boundary -- untouched.
 */
export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { osmId, restaurantName, lat, lon, phone, address, cuisine, details, restrictionsOverride } = route.params;

  useEffect(() => {
    navigation.setOptions({ title: restaurantName });
  }, [navigation, restaurantName]);

  // Record this visit for the Search screen's "Recently viewed" list.
  // Fire-and-forget: this is a nice-to-have, not something worth surfacing
  // an error state over if on-device storage hiccups.
  useEffect(() => {
    recordRecentlyViewed({ osmId, restaurantName, lat, lon, phone, address, cuisine, details }).catch(() => {});
  }, [osmId, restaurantName, lat, lon, phone, address, cuisine, details]);

  const [profile, setProfile] = useState<RestrictionProfile>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [safetyData, setSafetyData] = useState<RestaurantSafetyData | null>(null);
  const [communityItems, setCommunityItems] = useState<CommunityMenuItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingsSummary, setRatingsSummary] = useState<RatingsSummary | undefined>(undefined);
  const [feedbackByItem, setFeedbackByItem] = useState<Map<string, MenuItemFeedbackEntry[]>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [loadedProfile, data, ratingsByOsmId, keywords] = await Promise.all([
          loadProfile(),
          fetchRestaurantSafetyData(osmId, details?.brandWikidata),
          fetchRatingsSummaries([osmId]),
          loadCustomRestrictions(),
        ]);
        if (cancelled) return;
        setProfile(restrictionsOverride ?? loadedProfile);
        setCustomKeywords(keywords);
        setRatingsSummary(ratingsByOsmId.get(osmId));
        if (data) {
          setSafetyData(data);
          // Depends on the menu item ids just returned above, so it can't
          // join the Promise.all -- fetched right after instead of blocking
          // the rest of the screen behind it.
          // Per-item feedback is tied to a location's own menu items, not chain-wide ones.
          if (!data.chain) {
            fetchFeedbackForMenuItems(data.menuItems.map((item) => item.id)).then((byItem) => {
              if (!cancelled) setFeedbackByItem(byItem);
            });
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load safety data. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [osmId, restrictionsOverride]);

  // This page usually stays open on the Search stack while the diner edits
  // the Profile tab -- re-score as soon as restrictions are saved.
  useEffect(
    () =>
      onRestrictionsChanged(() => {
        if (!restrictionsOverride) loadProfile().then(setProfile);
        loadCustomRestrictions().then(setCustomKeywords);
      }),
    [restrictionsOverride]
  );

  const { width } = useWindowDimensions();
  const isWideLayout = Platform.OS === 'web' && width >= WIDE_LAYOUT_BREAKPOINT;

  function openDirections() {
    if (lat === undefined || lon === undefined) return;
    // Turn-by-turn directions (not a bare search pin), with a human-readable
    // destination label when we have one, falling back to raw coordinates.
    const destinationLabel = address ? `${restaurantName}, ${address}` : `${lat},${lon}`;
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${encodeURIComponent(destinationLabel)}` +
      `&travelmode=driving`;
    Linking.openURL(url);
  }

  function callRestaurant() {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  }

  function refreshRatingsSummary() {
    fetchRatingsSummaries([osmId])
      .then((byOsmId) => setRatingsSummary(byOsmId.get(osmId)))
      .catch(() => {});
  }

  async function shareRestaurant() {
    const lines = [restaurantName];
    if (address) lines.push(address);
    if (lat !== undefined && lon !== undefined) {
      lines.push(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    }
    lines.push('Shared via Safe Bites');
    try {
      await Share.share({ message: lines.join('\n'), title: restaurantName });
    } catch {
      // User cancelled or the share sheet isn't available -- nothing to surface.
    }
  }

  function handleFeedbackChange(menuItemId: string, entries: MenuItemFeedbackEntry[]) {
    setFeedbackByItem((prev) => new Map(prev).set(menuItemId, entries));
  }

  const cuisineList = formatCuisineList(cuisine);

  const countLabel = itemCountLabel(safetyData?.menuItems, communityItems, profile, customKeywords);

  return (
    <KeyboardAwareScreen>
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.container}
      contentContainerStyle={[styles.content, isWideLayout && styles.contentWide]}
    >
      <View style={styles.headerRow}>
        <View style={styles.cuisineAvatar}>
          <Text style={styles.cuisineAvatarEmoji}>{getCuisineEmoji(cuisine)}</Text>
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          {cuisineList && <Text style={styles.cuisineLabel}>{cuisineList}</Text>}
          {address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.address}>{address}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.shareIconButton}
          onPress={shareRestaurant}
          accessibilityLabel="Share this restaurant"
        >
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {(ratingsSummary || countLabel) && (
        <View style={styles.statsRow}>
          {countLabel && <Text style={styles.statsText}>{countLabel}</Text>}
          {ratingsSummary && (
            <Text style={styles.statsRatingsText}>{formatRatingsSummary(ratingsSummary)}</Text>
          )}
        </View>
      )}

      <View style={styles.actionRow}>
        {lat !== undefined && lon !== undefined && (
          <TouchableOpacity style={styles.actionButton} onPress={openDirections} accessibilityRole="button" accessibilityLabel="Get directions">
            <Ionicons name="navigate-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
        )}
        {phone && (
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={callRestaurant} accessibilityRole="button" accessibilityLabel={`Call ${phone}`}>
            <Ionicons name="call-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Call {phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      <AboutCard
        cuisine={cuisine}
        details={details}
        description={safetyData?.description ?? null}
        descriptionSource={safetyData?.descriptionSource ?? null}
      />

      {restrictionsOverride && (
        <View style={styles.overrideBanner}>
          <Ionicons name="options-outline" size={15} color={colors.brandDark} />
          <Text style={styles.overrideBannerText}>
            {restrictionsOverride.length > 0
              ? `Checking for ${restrictionsOverride
                  .map((r) => ALLERGENS.find((a) => a.code === r.allergenCode)?.label ?? r.allergenCode)
                  .join(', ')} (set in Search filters, not your saved profile)`
              : 'No allergens selected in Search filters, so nothing is being checked'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        {loading && <Text style={styles.body}>Loading safety data...</Text>}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && notFound && (
          <>
            <Text style={styles.body}>
              No safety data yet for this restaurant. It hasn't been reviewed for allergen/menu
              safety information yet -- check with the restaurant directly if you have a
              restriction.
            </Text>
            <ReviewRequestButton osmId={osmId} restaurantName={restaurantName} />
            <CommunityMenuSection osmId={osmId} restaurantName={restaurantName} customKeywords={customKeywords} onItemsChange={setCommunityItems} />
          </>
        )}

        {!loading && !error && safetyData && (
          <>
            <RestaurantSafetyBadge status={computeSafetyStatus(safetyData.menuItems, profile)} />
            <SafetyExplanation
              reasons={explainUnsafe(safetyData.menuItems, profile)}
              hasRestrictions={profile.length > 0}
              reviewedAt={safetyData.reviewedAt}
              verification={safetyData.verification}
              chain={safetyData.chain}
            />
            <MenuSafetyList
              menuItems={safetyData.menuItems}
              restrictions={profile}
              customKeywords={customKeywords}
              feedbackByItem={feedbackByItem}
              onFeedbackChange={handleFeedbackChange}
              allowFeedback={!safetyData.chain}
            />
            <CommunityMenuSection
              osmId={osmId}
              restaurantName={restaurantName}
              customKeywords={customKeywords}
              onItemsChange={setCommunityItems}
              hasReviewedMenu
            />
          </>
        )}
      </View>

      <View style={styles.ratingsBoundary}>
        <RatingsSection osmId={osmId} restaurantName={restaurantName} onSubmitted={refreshRatingsSummary} />
      </View>
    </ScrollView>
    </KeyboardAwareScreen>
  );
}

function AboutRow({ icon, label, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.aboutRow}>
      <Ionicons name={icon} size={16} color={colors.brand} style={styles.aboutIcon} />
      <View style={styles.aboutRowBody}>
        <Text style={styles.aboutLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

/**
 * "About" card built only from real OpenStreetMap tags (osm.ts's
 * RestaurantDetails) -- OSM carries no written descriptions for these
 * restaurants, and inventing one would misrepresent them.
 */
function AboutCard({
  cuisine,
  details,
  description,
  descriptionSource,
}: {
  cuisine?: string;
  details?: RestaurantDetails;
  description: string | null;
  descriptionSource: string | null;
}) {
  const cuisineList = formatCuisineList(cuisine);
  const services = serviceLabels(details);
  const sourceHost = descriptionSource?.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];

  return (
    <View style={styles.aboutCard}>
      <Text style={styles.aboutTitle}>About</Text>
      {description && (
        <View style={styles.aboutDescriptionBlock}>
          <Text style={styles.aboutDescription}>{description}</Text>
          {descriptionSource && (
            <TouchableOpacity onPress={() => Linking.openURL(descriptionSource)} accessibilityRole="link" accessibilityLabel="Open description source">
              <Text style={styles.aboutCaveat}>
                Source: <Text style={styles.aboutSourceLink}>{sourceHost}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {!hasAnyDetails(cuisine, details) ? (
        !description && (
        <Text style={styles.aboutEmpty}>
          OpenStreetMap doesn't list any details for this restaurant yet (cuisine, hours, or website).
        </Text>
        )
      ) : (
        <>
          {cuisineList && (
            <AboutRow icon="restaurant-outline" label="Cuisine">
              <Text style={styles.aboutValue}>{cuisineList}</Text>
            </AboutRow>
          )}
          {details?.openingHours && (
            <AboutRow icon="time-outline" label="Hours">
              {formatOpeningHours(details.openingHours).map((line) => (
                <Text key={line} style={styles.aboutValue}>
                  {line}
                </Text>
              ))}
            </AboutRow>
          )}
          {details?.diets && (
            <AboutRow icon="leaf-outline" label="Dietary options (self-reported)">
              <Text style={styles.aboutValue}>{details.diets.map(dietLabel).join(', ')}</Text>
              <Text style={styles.aboutCaveat}>
                Tagged on OpenStreetMap by contributors -- not Safe Bites safety data.
              </Text>
            </AboutRow>
          )}
          {services.length > 0 && (
            <AboutRow icon="storefront-outline" label="Services">
              <Text style={styles.aboutValue}>{services.join(' · ')}</Text>
            </AboutRow>
          )}
          {details?.website && (
            <AboutRow icon="globe-outline" label="Website">
              <TouchableOpacity onPress={() => Linking.openURL(details.website as string)} accessibilityRole="link" accessibilityLabel="Open restaurant website">
                <Text style={styles.aboutLink} numberOfLines={1}>
                  {details.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
                </Text>
              </TouchableOpacity>
            </AboutRow>
          )}
        </>
      )}
      {hasAnyDetails(cuisine, details) && (
        <Text style={styles.aboutSource}>Details from OpenStreetMap -- community-maintained, may be out of date.</Text>
      )}
    </View>
  );
}

function formatReviewedAt(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/**
 * Why the badge above says what it says: one line per failing restriction
 * (explainUnsafe -- the same function the verdict comes from), plus the
 * standing caveat that reviewed data is researched, not kitchen-verified.
 */
function SafetyExplanation({
  reasons,
  hasRestrictions,
  reviewedAt,
  verification,
  chain,
}: {
  reasons: string[];
  hasRestrictions: boolean;
  reviewedAt: string | null;
  verification: Verification;
  chain?: { name: string; allergenSource: string };
}) {
  const byRestaurant = verification === 'restaurant';
  const when = reviewedAt ? ` ${formatReviewedAt(reviewedAt)}` : '';
  return (
    <View style={styles.explanation}>
      <VerificationBadge verification={verification} />
      {reasons.map((reason) => (
        <View key={reason} style={styles.reasonRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.unsafe} style={styles.reasonIcon} />
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
      ))}
      {hasRestrictions && reasons.length === 0 && (
        <Text style={styles.reasonText}>
          Every one of your restrictions has at least one menu item confirmed safe.
        </Text>
      )}
      <Text style={styles.disclaimerText}>
        {chain
          ? `From the official ${chain.name} allergen guide${when ? `, checked${when}` : ''}. Individual locations may vary, so always tell staff about your allergy.`
          : byRestaurant
          ? `Allergen info confirmed by the restaurant${when}. Kitchens change recipes, so always tell your server about your allergy.`
          : `Menu reviewed${when} from published sources, not confirmed with the kitchen. Always tell your server about your allergy.`}
      </Text>
    </View>
  );
}

const VERIFICATION_TIERS: { key: Verification | 'community'; label: string; detail: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  {
    key: 'restaurant',
    label: 'Confirmed by restaurant',
    detail: 'The restaurant itself checked these allergen tags.',
    icon: 'shield-checkmark',
    color: colors.safe,
  },
  {
    key: 'chain',
    label: "From the chain's allergen guide",
    detail: "Taken from the chain's own published allergen guide, which covers all its locations. Individual locations may vary.",
    icon: 'business-outline',
    color: colors.safe,
  },
  {
    key: 'safe_bites',
    label: 'Researched by Safe Bites',
    detail: "Built by Safe Bites from the restaurant's published menu and allergen info, not confirmed with the kitchen.",
    icon: 'document-text-outline',
    color: colors.brand,
  },
  {
    key: 'community',
    label: 'Community, unverified',
    detail: 'Added by other diners. Never used for the Safe/Unsafe verdict.',
    icon: 'people-outline',
    color: colors.noData,
  },
];

/** Who verified this data, tappable to explain all three levels. */
function VerificationBadge({ verification }: { verification: Verification }) {
  const [open, setOpen] = useState(false);
  const tier = VERIFICATION_TIERS.find((t) => t.key === verification) ?? VERIFICATION_TIERS[2];
  return (
    <View style={styles.verification}>
      <TouchableOpacity
        style={[styles.verificationBadge, { borderColor: tier.color }]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${tier.label}. ${open ? 'Hide' : 'Show'} what verification levels mean`}
      >
        <Ionicons name={tier.icon} size={14} color={tier.color} />
        <Text style={[styles.verificationText, { color: tier.color }]}>{tier.label}</Text>
        <Ionicons name={open ? 'chevron-up' : 'information-circle-outline'} size={14} color={tier.color} />
      </TouchableOpacity>
      {open && (
        <View style={styles.verificationLegend}>
          {VERIFICATION_TIERS.map((t) => (
            <View key={t.key} style={styles.verificationLegendRow}>
              <Ionicons name={t.icon} size={14} color={t.color} style={styles.reasonIcon} />
              <Text style={styles.reasonText}>
                <Text style={{ fontWeight: '700', color: t.color }}>{t.label}{t.key === tier.key ? ' (this restaurant)' : ''}: </Text>
                {t.detail}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RestaurantSafetyBadge({ status }: { status: 'safe' | 'unsafe' }) {
  const config: Record<'safe' | 'unsafe', { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    safe: { label: 'Safe for your profile', color: colors.safe, bg: '#e7f2ec', icon: 'checkmark-circle' },
    unsafe: { label: 'Unsafe w/ disclaimer', color: colors.unsafe, bg: '#faf0e6', icon: 'alert-circle' },
  };
  const { label, color, bg, icon } = config[status];
  return (
    <View style={[styles.restaurantBadge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} style={{ marginRight: 5 }} />
      <Text style={[styles.restaurantBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** Filter for the menu-item list, relative to the diner's active restrictions. */
type MenuFilter = 'all' | 'safe_only';

const MENU_FILTER_OPTIONS: { value: MenuFilter; label: string }[] = [
  { value: 'all', label: 'All items' },
  { value: 'safe_only', label: 'Safe items only' },
];

function MenuSafetyList({
  menuItems,
  restrictions,
  customKeywords,
  feedbackByItem,
  onFeedbackChange,
  allowFeedback,
}: {
  menuItems: MenuItemWithTags[];
  /** False for chain-wide data: feedback belongs to one location's own menu items. */
  allowFeedback: boolean;
  restrictions: RestrictionProfile;
  customKeywords: string[];
  feedbackByItem: Map<string, MenuItemFeedbackEntry[]>;
  onFeedbackChange: (menuItemId: string, entries: MenuItemFeedbackEntry[]) => void;
}) {
  const [menuFilter, setMenuFilter] = useState<MenuFilter>('all');
  const activeAllergenCodes = Array.from(new Set(restrictions.map((entry) => entry.allergenCode)));
  const hasAnyRestriction = restrictions.length > 0 || customKeywords.length > 0;
  const isSafe = (item: MenuItemWithTags) => itemIsSafeForProfile(item, restrictions, customKeywords);

  if (menuItems.length === 0) {
    return <Text style={styles.body}>This restaurant has no menu items on file yet.</Text>;
  }

  // Items safe for the whole profile sort first (itemIsSafeForProfile is
  // severity-aware -- see safetyStatus.ts); otherwise preserve menu order
  // (sort is stable).
  const sortedItems =
    !hasAnyRestriction ? menuItems : [...menuItems].sort((a, b) => Number(isSafe(b)) - Number(isSafe(a)));

  const visibleItems =
    menuFilter === 'safe_only' && hasAnyRestriction ? sortedItems.filter(isSafe) : sortedItems;

  return (
    <View>
      <Text style={styles.sectionTitle}>Menu</Text>
      {!hasAnyRestriction && (
        <Text style={styles.hint}>
          No restrictions set in your profile -- add some in the Profile tab to see per-item
          safety labels.
        </Text>
      )}

      {customKeywords.length > 0 && (
        <Text style={styles.hint}>
          Custom restrictions ({customKeywords.join(', ')}) are only checked against what each item's
          name and description say.
        </Text>
      )}

      {hasAnyRestriction && (
        <View style={styles.menuFilterRow}>
          {MENU_FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.menuFilterChip, menuFilter === opt.value && styles.menuFilterChipSelected]} accessibilityRole="button" accessibilityState={{ selected: menuFilter === opt.value }}
              onPress={() => setMenuFilter(opt.value)}
            >
              <Text
                style={[
                  styles.menuFilterChipText,
                  menuFilter === opt.value && styles.menuFilterChipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {visibleItems.length === 0 ? (
        <Text style={styles.body}>
          No menu items are marked safe for all of your restrictions. Try "All items".
        </Text>
      ) : (
        visibleItems.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemHeaderRow}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              {item.price !== null && (
                <Text style={styles.menuItemPrice}>${Number(item.price).toFixed(2)}</Text>
              )}
            </View>
            {item.description && <Text style={styles.menuItemDescription}>{item.description}</Text>}

            {(activeAllergenCodes.length > 0 || itemMentions(item, customKeywords).length > 0) && (
              <View style={styles.tagRow}>
                {activeAllergenCodes.map((code) => (
                  <AllergenTagBadge key={code} code={code} label={labelForItemAllergen(item, code)} />
                ))}
                {itemMentions(item, customKeywords).map((keyword) => (
                  <MentionBadge key={keyword} keyword={keyword} />
                ))}
              </View>
            )}

            {allowFeedback && (
              <MenuItemFeedback
                menuItemId={item.id}
                entries={feedbackByItem.get(item.id) ?? []}
                onEntriesChange={(entries) => onFeedbackChange(item.id, entries)}
              />
            )}
          </View>
        ))
      )}
    </View>
  );
}

function AllergenTagBadge({ code, label }: { code: string; label: ItemAllergenLabel }) {
  const allergenLabel = ALLERGENS.find((a) => a.code === code)?.label ?? code;
  const { label: tagLabel, color } = ALLERGEN_TAG_INFO[label];

  return (
    <View style={[styles.tagBadge, { borderColor: color }]}>
      <Text style={[styles.tagBadgeText, { color }]}>
        {allergenLabel}: {tagLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 14,
    width: '100%',
  },
  contentWide: {
    maxWidth: WIDE_LAYOUT_MAX_WIDTH,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  cuisineAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cuisineAvatarEmoji: {
    fontSize: 22,
  },
  headerTextBlock: {
    flex: 1,
    paddingTop: 2,
  },
  shareIconButton: {
    padding: 6,
    marginTop: 2,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cuisineLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  address: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsText: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: '600',
  },
  statsRatingsText: {
    color: colors.rating,
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  callButton: {
    // Darker than colors.rating (#FC9D03) -- white button text needs ~4.5:1
    // contrast, the lighter JG orange alone only clears ~2:1.
    backgroundColor: '#a15e04',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  aboutCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: colors.card,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  aboutDescriptionBlock: {
    marginBottom: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  aboutSourceLink: {
    color: colors.brand,
    textDecorationLine: 'underline',
  },
  overrideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e6f0f3',
    marginBottom: 14,
  },
  overrideBannerText: {
    flex: 1,
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  aboutEmpty: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  aboutRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 7,
  },
  aboutIcon: {
    marginTop: 1,
  },
  aboutRowBody: {
    flex: 1,
  },
  aboutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  aboutValue: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  aboutCaveat: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aboutLink: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  aboutSource: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 4,
  },
  explanation: {
    marginTop: -6,
    marginBottom: 14,
    gap: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  reasonIcon: {
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restaurantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginBottom: 14,
  },
  restaurantBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.danger,
  },
  verification: {
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 14,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verificationLegend: {
    marginTop: 8,
    gap: 6,
  },
  verificationLegendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hint: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  menuFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  menuFilterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  menuFilterChipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  menuFilterChipText: {
    color: '#3a3f37',
    fontSize: 13,
    fontWeight: '500',
  },
  menuFilterChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  menuItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  menuItemPrice: {
    color: '#444',
    fontWeight: '600',
  },
  menuItemDescription: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingsBoundary: {
    // Visual/structural boundary marking where D4's work is scoped to.
  },
});
