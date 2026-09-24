import { supabase } from './supabase';
import type { AllergenStatus, Database } from './database.types';
import { forgetOwnedSubmission, rememberOwnedSubmission } from './ownedSubmissions';

/**
 * Community-submitted menu items for a restaurant with no reviewed safety
 * data yet -- entirely separate from menu_items/menu_item_allergen_tags
 * (supabase/migrations/0004_community_menu_items.sql), keyed by osm_id like
 * `ratings` since there's no restaurants row to attach to. Unverified by
 * design: never read by safetyStatus.ts, never promoted into the curated
 * tables.
 */
export interface CommunityMenuItemTag {
  allergenCode: string;
  status: AllergenStatus;
}

export interface CommunityMenuItem {
  id: string;
  osmId: number;
  name: string;
  description: string | null;
  price: number | null;
  createdAt: string;
  updatedAt: string | null;
  tags: CommunityMenuItemTag[];
}

export async function fetchCommunityMenuItems(osmId: number): Promise<CommunityMenuItem[]> {
  return (await fetchCommunityMenuItemsForRestaurants([osmId])).get(osmId) ?? [];
}

// Keeps each `.in()` filter's URL comfortably short (same as safetyStatus.ts).
const IN_CHUNK_SIZE = 150;

function chunk<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += IN_CHUNK_SIZE) out.push(list.slice(i, i + IN_CHUNK_SIZE));
  return out;
}

/**
 * Community items (with tags) for many restaurants at once, newest first --
 * one request per chunk rather than per restaurant, so search results can
 * show community counts cheaply. Restaurants with none are absent from the map.
 */
export async function fetchCommunityMenuItemsForRestaurants(
  osmIds: number[]
): Promise<Map<number, CommunityMenuItem[]>> {
  const result = new Map<number, CommunityMenuItem[]>();
  if (osmIds.length === 0) return result;

  const items: CommunityMenuItemRow[] = [];
  for (const ids of chunk(osmIds)) {
    const { data, error } = await supabase
      .from('community_menu_items')
      .select('*')
      .in('osm_id', ids)
      .order('created_at', { ascending: false });
    if (!error && data) items.push(...data);
  }
  if (items.length === 0) return result;

  const tagsByItem = new Map<string, CommunityMenuItemTag[]>();
  for (const ids of chunk(items.map((item) => item.id))) {
    const { data: tags } = await supabase
      .from('community_menu_item_allergen_tags')
      .select('*')
      .in('community_menu_item_id', ids);
    for (const tag of tags ?? []) {
      const list = tagsByItem.get(tag.community_menu_item_id);
      const entry = { allergenCode: tag.allergen_code, status: tag.status };
      if (list) {
        list.push(entry);
      } else {
        tagsByItem.set(tag.community_menu_item_id, [entry]);
      }
    }
  }

  for (const row of items) {
    const list = result.get(row.osm_id);
    const item = toItem(row, tagsByItem.get(row.id) ?? []);
    if (list) {
      list.push(item);
    } else {
      result.set(row.osm_id, [item]);
    }
  }
  return result;
}

type CommunityMenuItemRow = Database['public']['Tables']['community_menu_items']['Row'];

function toItem(row: CommunityMenuItemRow, tags: CommunityMenuItemTag[]): CommunityMenuItem {
  return {
    id: row.id,
    osmId: row.osm_id,
    name: row.name,
    description: row.description,
    price: row.price,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
  };
}

export interface CommunityMenuItemInput {
  name: string;
  description?: string;
  price?: number;
  tags: CommunityMenuItemTag[];
}

function tagsJson(tags: CommunityMenuItemTag[]) {
  return tags.map((tag) => ({ allergen_code: tag.allergenCode, status: tag.status }));
}

/**
 * Item + tags are written in one call (create_community_menu_item, 0005
 * migration), which also returns a one-time ownership secret kept on this
 * device so only the submitter can later edit or delete the item.
 */
export async function submitCommunityMenuItem(
  osmId: number,
  restaurantName: string,
  input: CommunityMenuItemInput
): Promise<CommunityMenuItem> {
  const { data, error } = await supabase.rpc('create_community_menu_item', {
    p_osm_id: osmId,
    p_restaurant_name: restaurantName,
    p_name: input.name,
    p_description: input.description ?? '',
    p_price: input.price ?? null,
    p_tags: tagsJson(input.tags),
  });

  if (error || !data) {
    throw error ?? new Error('Could not submit menu item.');
  }

  const result = data as unknown as { row: CommunityMenuItemRow; owner_secret: string };
  await rememberOwnedSubmission(result.row.id, result.owner_secret);
  return toItem(result.row, input.tags);
}

export async function updateCommunityMenuItem(
  id: string,
  ownerSecret: string,
  input: CommunityMenuItemInput
): Promise<void> {
  const { data, error } = await supabase.rpc('update_community_menu_item', {
    p_id: id,
    p_owner_secret: ownerSecret,
    p_name: input.name,
    p_description: input.description ?? '',
    p_price: input.price ?? null,
    p_tags: tagsJson(input.tags),
  });
  if (error || data !== true) {
    throw error ?? new Error('Could not update menu item.');
  }
}

export async function deleteCommunityMenuItem(id: string, ownerSecret: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_community_menu_item', {
    p_id: id,
    p_owner_secret: ownerSecret,
  });
  if (error || data !== true) {
    throw error ?? new Error('Could not delete menu item.');
  }
  await forgetOwnedSubmission(id);
}
