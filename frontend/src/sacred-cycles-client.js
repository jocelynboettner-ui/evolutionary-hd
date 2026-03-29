/**
 * sacred-cycles-client.js
 * Drop-in replacement for the age-based calculateCycles() function.
 *
 * Usage: replace your existing calculateCycles() call with fetchTransitCycles()
 * The return shape is identical so the rest of your app stays the same.
 */

const SACRED_CYCLES_URL = import.meta.env.VITE_SACRED_CYCLES_URL || "http://localhost:8000";

/**
 * Geocode a birthplace string to lat/lng using Nominatim (OpenStreetMap).
 * Free, no API key required.
 * For production, consider Google Maps Geocoding API for higher rate limits.
 */
async function geocodeBirthplace(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "SacredCyclesApp/1.0" }
  });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not geocode: "${place}"`);
  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
}

/**
 * Main function -- replaces calculateCycles(birthdate, selectedCycles)
 *
 * @param {string} birthdate  -- "1974-03-15"
 * @param {string} birthtime  -- "14:30" (or null for noon)
 * @param {string} birthplace -- "New York, USA"
 * @param {string} timezone   -- "America/New_York" (auto-detected if omitted)
 * @returns {{ saturn, chiron, uranus }} -- each with { start, peak, end, natal_degree, peak_transit_degree }
 */
export async function fetchTransitCycles(birthdate, birthtime, birthplace, timezone) {
  const { latitude, longitude } = await geocodeBirthplace(birthplace);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const response = await fetch(`${SACRED_CYCLES_URL}/transit-cycles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date:      birthdate,
      time:      birthtime || "12:00",
      latitude,
      longitude,
      timezone:  tz,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Transit calculation failed");
  }

  const data = await response.json();

  // Normalize to the shape your frontend already expects
  return {
    saturn: data.saturnReturn,
    chiron: data.chironReturn,
    uranus: data.uranusOpposition,
  };
}

/**
 * Fetch Human Design chart data.
 * Returns Type, Strategy, Authority, Profile, gates, channels, centers.
 *
 * @param {string} birthdate  -- "1974-03-15"
 * @param {string} birthtime  -- "14:30"
 * @param {string} timezone   -- "America/New_York"
 */
export async function fetchHumanDesign(birthdate, birthtime, timezone) {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const response = await fetch(`${SACRED_CYCLES_URL}/human-design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date:     birthdate,
      time:     birthtime || "12:00",
      timezone: tz,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Human Design calculation failed");
  }

  return response.json();
}

// ── Example usage ──────────────────────────────────────────────────────────
//
// BEFORE (age-based estimate):
//   const cycles = calculateCycles(birthdate, selectedCycles);
//
// AFTER (real planetary degrees):
//   const cycles = await fetchTransitCycles(birthdate, birthtime, birthplace);
//
// AFTER (full HD chart + cycles together):
//   const [cycles, chart] = await Promise.all([
//     fetchTransitCycles(birthdate, birthtime, birthplace),
//     fetchHumanDesign(birthdate, birthtime, timezone),
//   ]);
//
// Everything downstream (Claude interpretation, PDF, card rendering) stays identical.
