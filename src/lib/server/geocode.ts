"use server";

// Photon (https://photon.komoot.io) — OSM-backed geocoder, no API key, lenient rate limits.
// Used to dodge Nominatim's strict 1 req/sec + IP throttling. Same OSM data quality.
const cache = new Map<string, { lat: number; lng: number } | null>();

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    city?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (cache.has(query)) return cache.get(query)!;
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CanvasingThing/0.1" },
    });
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await res.json()) as { features: PhotonFeature[] };
    const feat = data.features?.[0];
    if (!feat) {
      cache.set(query, null);
      return null;
    }
    const [lng, lat] = feat.geometry.coordinates;
    const out = { lat, lng };
    cache.set(query, out);
    return out;
  } catch {
    cache.set(query, null);
    return null;
  }
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
