import type { RestaurantDetails } from '../lib/osm';
import type { RestrictionProfile } from '../lib/profileStorage';

/**
 * Navigation param lists. Kept in one place so screens and navigators share
 * the same types (see React Navigation's TypeScript guide).
 */
export type SearchStackParamList = {
  Search: undefined;
  RestaurantDetail: {
    osmId: number;
    restaurantName: string;
    lat?: number;
    lon?: number;
    phone?: string;
    address?: string;
    cuisine?: string;
    details?: RestaurantDetails;
    /** Set when the Search screen's "Safe for" filter differs from the saved profile (this search only). */
    restrictionsOverride?: RestrictionProfile;
  };
};

export type RootTabParamList = {
  SearchStack: undefined;
  Profile: undefined;
};
