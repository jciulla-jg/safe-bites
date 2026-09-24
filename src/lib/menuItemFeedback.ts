import { supabase } from './supabase';
import type { AllergenStatus, Database } from './database.types';
import { forgetOwnedSubmission, rememberOwnedSubmission } from './ownedSubmissions';

/**
 * User-submitted allergen feedback on a menu item -- crowd-sourced, NOT the
 * curated menu_item_allergen_tags data safetyStatus.ts computes safety from.
 * Kept in its own table (supabase/migrations/0003_menu_item_allergen_feedback.sql)
 * so it can only ever be additive/informational in the UI, never silently
 * change what "Safe"/"Unsafe" means.
 */
export interface MenuItemFeedbackEntry {
  id: string;
  menuItemId: string;
  allergenCode: string;
  status: AllergenStatus;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** Batched: one query for every menu item on the current restaurant, grouped by menu item id. */
export async function fetchFeedbackForMenuItems(
  menuItemIds: string[]
): Promise<Map<string, MenuItemFeedbackEntry[]>> {
  const byItem = new Map<string, MenuItemFeedbackEntry[]>();
  if (menuItemIds.length === 0) {
    return byItem;
  }

  const { data, error } = await supabase
    .from('menu_item_allergen_feedback')
    .select('id, menu_item_id, allergen_code, status, comment, created_at, updated_at, report_count')
    .in('menu_item_id', menuItemIds)
    .order('created_at', { ascending: false });

  if (error || !data) {
    // Feedback is a nice-to-have overlay -- don't fail the whole detail
    // screen if it can't load.
    return byItem;
  }

  for (const row of data) {
    const entry = toEntry(row);
    const existing = byItem.get(entry.menuItemId);
    if (existing) {
      existing.push(entry);
    } else {
      byItem.set(entry.menuItemId, [entry]);
    }
  }

  return byItem;
}

// Everything the app reads; the owner_hash column isn't readable by anon (0011).
type FeedbackRow = Omit<Database['public']['Tables']['menu_item_allergen_feedback']['Row'], 'owner_hash'>;

function toEntry(row: FeedbackRow): MenuItemFeedbackEntry {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    allergenCode: row.allergen_code,
    status: row.status,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Creates the entry through create_menu_item_feedback (0005 migration),
 * which returns a one-time ownership secret; it's kept on this device so the
 * submitter -- and only the submitter -- can later edit or delete it.
 */
export async function submitMenuItemFeedback(input: {
  menuItemId: string;
  allergenCode: string;
  status: AllergenStatus;
  comment?: string;
}): Promise<MenuItemFeedbackEntry> {
  const { data, error } = await supabase.rpc('create_menu_item_feedback', {
    p_menu_item_id: input.menuItemId,
    p_allergen_code: input.allergenCode,
    p_status: input.status,
    p_comment: input.comment ?? '',
  });

  if (error || !data) {
    throw error ?? new Error('Could not submit feedback.');
  }

  const result = data as unknown as { row: FeedbackRow; owner_secret: string };
  await rememberOwnedSubmission(result.row.id, result.owner_secret);
  return toEntry(result.row);
}

export async function updateMenuItemFeedback(
  id: string,
  ownerSecret: string,
  changes: { status: AllergenStatus; comment: string }
): Promise<void> {
  const { data, error } = await supabase.rpc('update_menu_item_feedback', {
    p_id: id,
    p_owner_secret: ownerSecret,
    p_status: changes.status,
    p_comment: changes.comment,
  });
  if (error || data !== true) {
    throw error ?? new Error('Could not update feedback.');
  }
}

export async function deleteMenuItemFeedback(id: string, ownerSecret: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_menu_item_feedback', {
    p_id: id,
    p_owner_secret: ownerSecret,
  });
  if (error || data !== true) {
    throw error ?? new Error('Could not delete feedback.');
  }
  await forgetOwnedSubmission(id);
}
