import { supabase } from './supabase';
import type { Database } from './database.types';

/**
 * Batched ratings aggregation: one `.in('osm_id', [...])` query covers a whole
 * page of search results instead of one request per restaurant.
 * `RatingsSection.tsx` keeps its own single-restaurant fetch because it also
 * needs the individual rows (comments) that this summary deliberately drops.
 */

type RatingRow = Database['public']['Tables']['ratings']['Row'];

export interface RatingsSummary {
  count: number;
  avgAccuracy: number;
  avgAccommodation: number;
}

/**
 * Batch-fetch ratings for a set of restaurants (by osm_id) in a single
 * request and return per-restaurant averages. Restaurants with zero ratings
 * are simply absent from the returned map (callers should treat "no entry"
 * as "nothing to show", not as an error).
 */
export async function fetchRatingsSummaries(osmIds: number[]): Promise<Map<number, RatingsSummary>> {
  const summaries = new Map<number, RatingsSummary>();
  if (osmIds.length === 0) {
    return summaries;
  }

  // Chunked like fetchSafetyDataForRestaurants: `.in()` values go in the URL.
  const data: Pick<RatingRow, 'osm_id' | 'accuracy_rating' | 'accommodation_rating'>[] = [];
  for (let i = 0; i < osmIds.length; i += 150) {
    const { data: rows, error } = await supabase
      .from('ratings')
      .select('osm_id, accuracy_rating, accommodation_rating')
      .in('osm_id', osmIds.slice(i, i + 150));
    if (error || !rows) {
      // Don't fail the whole search over a ratings-summary hiccup -- just
      // surface no summaries, same "degrade gracefully" posture as the
      // safety-data fetch in SearchScreen.
      return summaries;
    }
    data.push(...rows);
  }

  const totals = new Map<number, { accuracySum: number; accommodationSum: number; count: number }>();
  for (const row of data) {
    const existing = totals.get(row.osm_id) ?? { accuracySum: 0, accommodationSum: 0, count: 0 };
    existing.accuracySum += row.accuracy_rating;
    existing.accommodationSum += row.accommodation_rating;
    existing.count += 1;
    totals.set(row.osm_id, existing);
  }

  for (const [osmId, totalsForRestaurant] of totals) {
    summaries.set(osmId, {
      count: totalsForRestaurant.count,
      avgAccuracy: totalsForRestaurant.accuracySum / totalsForRestaurant.count,
      avgAccommodation: totalsForRestaurant.accommodationSum / totalsForRestaurant.count,
    });
  }

  return summaries;
}

/** Compact display string, e.g. "★4.2 accuracy · ★3.8 accommodation (12)". */
export function formatRatingsSummary(summary: RatingsSummary): string {
  return (
    `★${summary.avgAccuracy.toFixed(1)} accuracy · ` +
    `★${summary.avgAccommodation.toFixed(1)} accommodation (${summary.count})`
  );
}
