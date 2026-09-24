/**
 * OpenStreetMap restaurant discovery (ADR-0002): Nominatim for zip -> lat/lon
 * geocoding, Overpass API for nearby amenity=restaurant search. Fully live,
 * no cost, no credentials.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Nominatim's usage policy requires a descriptive User-Agent identifying the
// app -- see ADR-0002.
const USER_AGENT = 'SafeBites-Hackathon/1.0';

export interface GeocodeResult {
  lat: number;
  lon: number;
  /**
   * Human-readable "City, ST" label built from Nominatim's addressdetails,
   * when available (e.g. "Schenectady, NY"). Absent if the geocode result
   * didn't include usable city/state fields -- callers should fall back to
   * the raw zip code in that case.
   */
  locationLabel?: string;
}

export class OsmError extends Error {
  /** True when the service failed (busy, unreachable), not when it answered "no". */
  transient: boolean;
  constructor(message: string, transient = false) {
    super(message);
    this.transient = transient;
  }
}

// US state full-name -> USPS abbreviation, used to shorten Nominatim's
// address.state (which is typically the full name for US results) for the
// compact status-text label. Any state not in this table is shown in full.
const US_STATE_ABBREVIATIONS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH',
  Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'District of Columbia': 'DC',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The free public Nominatim/Overpass instances regularly return 429/502/503/
 * 504 under load (seen twice in one test session). Retry twice with a
 * growing delay before giving up; the Search screen then falls back to saved
 * results (searchCache.ts) when it has them.
 */
const RETRY_DELAYS_MS = [800, 2000];

async function fetchWithRetry(url: string, init: RequestInit, unreachableMessage: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < RETRY_DELAYS_MS.length;
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      if (canRetry) {
        await delay(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new OsmError(unreachableMessage, true);
    }
    if ((response.status >= 500 || response.status === 429) && canRetry) {
      await delay(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    return response;
  }
}

/** Geocode a US zip code to a lat/lon via Nominatim. */
export async function geocodeZip(zip: string): Promise<GeocodeResult> {
  const url = `${NOMINATIM_URL}?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1&addressdetails=1`;
  const response = await fetchWithRetry(
    url,
    { headers: { 'User-Agent': USER_AGENT } },
    'Could not reach the location lookup service. Check your connection and try again.'
  );

  if (!response.ok) {
    throw new OsmError('Location lookup failed. Please try again.', true);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new OsmError(`No location found for zip code "${zip}". Double-check the zip and try again.`);
  }

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new OsmError('Location lookup returned an unexpected result. Please try again.');
  }

  let locationLabel: string | undefined;
  const address = first.address;
  if (address && typeof address === 'object') {
    // Nominatim uses different keys depending on settlement size/type, and
    // for some NY-style municipalities prefixes the value with "City of "/
    // "Town of "/"Village of " (the formal municipal name) -- strip that for
    // a label that reads naturally, e.g. "Schenectady, NY" not "City of
    // Schenectady, NY".
    const rawCity: string | undefined = address.city ?? address.town ?? address.village;
    const city = rawCity?.replace(/^(City|Town|Village) of\s+/i, '');
    const state: string | undefined = address.state;
    if (city && state) {
      locationLabel = `${city}, ${US_STATE_ABBREVIATIONS[state] ?? state}`;
    }
  }

  return { lat, lon, locationLabel };
}

/**
 * Descriptive facts OpenStreetMap contributors have tagged on a restaurant.
 * OSM has no prose descriptions for restaurants in practice (none in the
 * 12305 area carry a `description` tag), so the app describes a restaurant
 * only from these structured, real tags -- never invented copy. Every field
 * is optional; coverage is patchy.
 */
export interface RestaurantDetails {
  website?: string;
  /** Raw OSM opening_hours value, e.g. "Tu-Su 11:00-22:00". */
  openingHours?: string;
  /** Diet tags marked yes/only, e.g. [{ code: 'vegan', only: false }]. Self-reported, not Safe Bites data. */
  diets?: { code: string; only: boolean }[];
  takeaway?: boolean;
  delivery?: boolean;
  outdoorSeating?: boolean;
  driveThrough?: boolean;
  wheelchair?: 'yes' | 'limited' | 'no';
  /** OSM `brand:wikidata`, e.g. "Q38076" for McDonald's -- links a location to its chain's data (0009). */
  brandWikidata?: string;
}

export interface OsmRestaurant {
  osmId: number;
  name: string;
  lat: number;
  lon: number;
  phone?: string;
  address?: string;
  /** OSM's raw `cuisine` tag, e.g. "pizza", "chinese;seafood". May list several, semicolon-separated. */
  cuisine?: string;
  details: RestaurantDetails;
}

const DIET_CODES = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'nut_free', 'soy_free', 'halal', 'kosher'];

function yesNo(value: unknown): boolean | undefined {
  if (value === 'yes' || value === 'only') return true;
  if (value === 'no') return false;
  return undefined;
}

function parseDetails(tags: Record<string, string>): RestaurantDetails {
  const rawWebsite = tags.website ?? tags['contact:website'];
  const website = rawWebsite ? (/^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`) : undefined;
  const diets = DIET_CODES.filter((code) => {
    const value = tags[`diet:${code}`];
    return value === 'yes' || value === 'only';
  }).map((code) => ({ code, only: tags[`diet:${code}`] === 'only' }));
  const wheelchair = tags.wheelchair;

  return {
    website,
    openingHours: tags.opening_hours || undefined,
    diets: diets.length > 0 ? diets : undefined,
    takeaway: yesNo(tags.takeaway),
    delivery: yesNo(tags.delivery),
    outdoorSeating: yesNo(tags.outdoor_seating),
    driveThrough: yesNo(tags.drive_through),
    wheelchair: wheelchair === 'yes' || wheelchair === 'limited' || wheelchair === 'no' ? wheelchair : undefined,
    brandWikidata: /^Q\d+$/.test(tags['brand:wikidata'] ?? '') ? tags['brand:wikidata'] : undefined,
  };
}

/** Case- and accent-insensitive "name contains" match, for searching by restaurant name. */
export function nameMatches(name: string, query: string): boolean {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[’`]/g, "'");
  return normalize(name).includes(normalize(query.trim()));
}

/**
 * Search for nearby amenity=restaurant nodes/ways via the Overpass API, plus
 * fast-food places and cafes that belong to a chain (brand:wikidata) -- most chains are
 * tagged fast_food, and unbranded takeout spots would flood the results.
 * Name searches deliberately filter the results client-side (nameMatches)
 * rather than with an Overpass `name~` regex: the public server times out
 * on regex-over-radius queries (measured: 51s, then a runtime error).
 */
export async function searchNearbyRestaurants(
  lat: number,
  lon: number,
  radiusMeters: number
): Promise<OsmRestaurant[]> {
  const query = `[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  way["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
  node["amenity"="fast_food"]["brand:wikidata"](around:${radiusMeters},${lat},${lon});
  way["amenity"="fast_food"]["brand:wikidata"](around:${radiusMeters},${lat},${lon});
  node["amenity"="cafe"]["brand:wikidata"](around:${radiusMeters},${lat},${lon});
  way["amenity"="cafe"]["brand:wikidata"](around:${radiusMeters},${lat},${lon});
);
out center;`;

  const response = await fetchWithRetry(
    OVERPASS_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': USER_AGENT,
      },
      body: query,
    },
    'Could not reach the restaurant search service. Check your connection and try again.'
  );

  if (!response.ok) {
    throw new OsmError('Restaurant search failed. Please try again.', true);
  }

  const data = await response.json();
  // Overpass reports a server-side timeout as HTTP 200 with zero elements and
  // a "runtime error" remark -- without this check it looks like "no
  // restaurants here" instead of a failed search the diner can retry.
  if (typeof data?.remark === 'string' && /runtime error/i.test(data.remark)) {
    throw new OsmError('The restaurant search timed out. Please try again.', true);
  }
  const elements: any[] = Array.isArray(data?.elements) ? data.elements : [];

  const results: OsmRestaurant[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name: string | undefined = tags.name;
    if (!name) {
      continue; // skip unnamed results -- not useful to show the diner
    }

    const elLat = el.type === 'node' ? el.lat : el.center?.lat;
    const elLon = el.type === 'node' ? el.lon : el.center?.lon;
    if (typeof elLat !== 'number' || typeof elLon !== 'number') {
      continue;
    }

    const phone: string | undefined = tags.phone ?? tags['contact:phone'];
    const addressParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    );
    const address = addressParts.length > 0 ? addressParts.join(' ') : undefined;

    results.push({
      osmId: el.id,
      name,
      lat: elLat,
      lon: elLon,
      phone,
      address,
      cuisine: typeof tags.cuisine === 'string' ? tags.cuisine : undefined,
      details: parseDetails(tags),
    });
  }

  return results;
}

export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

/** Straight-line distance in miles between two lat/lon points (haversine). */
export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R_MILES = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_MILES * c;
}
