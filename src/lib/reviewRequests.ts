import { supabase } from './supabase';
import { deviceId } from './deviceId';

/**
 * "Request a safety review" for a restaurant with no reviewed data
 * (0008_review_requests.sql). One request per device per restaurant; the
 * server only ever sees a hash of this device's random id.
 */

export interface ReviewRequestStatus {
  count: number;
  requestedByMe: boolean;
}

export async function fetchReviewRequestStatus(osmId: number): Promise<ReviewRequestStatus | null> {
  const { data, error } = await supabase.rpc('review_request_status', {
    p_osm_id: osmId,
    p_device_id: await deviceId(),
  });
  const row = data?.[0];
  if (error || !row) return null;
  return { count: row.request_count, requestedByMe: row.requested_by_me };
}

/** Returns the new total number of diners who asked. */
export async function requestReview(osmId: number, restaurantName: string): Promise<number> {
  const { data, error } = await supabase.rpc('request_review', {
    p_osm_id: osmId,
    p_restaurant_name: restaurantName,
    p_device_id: await deviceId(),
  });
  if (error || typeof data !== 'number') throw error ?? new Error('Could not send request.');
  return data;
}
