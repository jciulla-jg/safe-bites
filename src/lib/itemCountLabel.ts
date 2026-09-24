import { countSafeItems, type MenuItemWithTags } from './safetyStatus';
import type { RestrictionProfile } from './profileStorage';

const plural = (n: number) => (n === 1 ? '' : 's');

/**
 * The at-a-glance "N of M items safe for you" line on the search tile and
 * the restaurant page. Community items (unverified, diner-tagged) are added
 * into the total but always called out, so nobody mistakes them for
 * reviewed data. They never affect the Safe/Unsafe verdict itself.
 * Returns null when there are no items at all.
 */
export function itemCountLabel(
  reviewed: MenuItemWithTags[] | undefined,
  community: MenuItemWithTags[] | undefined,
  profile: RestrictionProfile,
  customKeywords: string[]
): string | null {
  const reviewedTotal = reviewed?.length ?? 0;
  const communityTotal = community?.length ?? 0;
  if (reviewedTotal + communityTotal === 0) return null;

  if (profile.length + customKeywords.length === 0) {
    if (communityTotal === 0) return `${reviewedTotal} item${plural(reviewedTotal)} on menu`;
    if (reviewedTotal === 0) return `${communityTotal} community item${plural(communityTotal)} (unverified)`;
    return `${reviewedTotal + communityTotal} items on menu (${communityTotal} from community, unverified)`;
  }

  const reviewedSafe = reviewed ? countSafeItems(reviewed, profile, customKeywords) : 0;
  const communitySafe = community ? countSafeItems(community, profile, customKeywords) : 0;
  if (communityTotal === 0) return `${reviewedSafe} of ${reviewedTotal} item${plural(reviewedTotal)} safe for you`;
  if (reviewedTotal === 0) {
    return `${communitySafe} of ${communityTotal} community item${plural(communityTotal)} look safe (unverified)`;
  }
  return (
    `${reviewedSafe + communitySafe} of ${reviewedTotal + communityTotal} items safe for you ` +
    `(${communitySafe} of ${communityTotal} from community, unverified)`
  );
}
