/**
 * Whole-word text matching for custom restrictions (customRestrictions.ts
 * stores them). Kept free of any React Native import so the matching rules
 * can be unit-tested in plain Node (npm test).
 */

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Which of `keywords` the text mentions, as whole words with an optional
 * plural ("egg" matches "Eggs", "beef" doesn't match "Beefeater" -- but does
 * match "beef-style"). Case- and accent-insensitive.
 */
export function findMentions(text: string, keywords: string[]): string[] {
  const haystack = normalize(text);
  return keywords.filter((keyword) => {
    const needle = normalize(keyword.trim());
    if (!needle) return false;
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}(e?s)?(?=$|[^a-z0-9])`).test(haystack);
  });
}

/** Keywords mentioned in a menu item's name or description. */
export function itemMentions(item: { name: string; description: string | null }, keywords: string[]): string[] {
  if (keywords.length === 0) return [];
  return findMentions(`${item.name} ${item.description ?? ''}`, keywords);
}
