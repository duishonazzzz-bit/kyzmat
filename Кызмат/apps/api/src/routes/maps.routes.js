const { Router } = require("express");
const { z } = require("zod");
const { env } = require("../config/env");

const router = Router();

const geocodeSchema = z.object({
  city: z.string().min(2).max(120),
  address: z.string().min(5).max(240),
});

const routeSchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
});

const autocompleteSchema = z.object({
  input: z.string().min(2).max(160),
  city: z.string().min(2).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(5).optional(),
});

const kyrgyzstanCityCenters = {
  "айдаркен": { latitude: 39.9422, longitude: 71.3419 },
  "балыкчы": { latitude: 42.4611, longitude: 76.1874 },
  "баткен": { latitude: 40.0626, longitude: 70.8194 },
  "базар-коргон": { latitude: 41.0361, longitude: 72.7458 },
  "бишкек": { latitude: 42.8746, longitude: 74.5698 },
  "гульчо": { latitude: 40.3132, longitude: 73.4436 },
  "джалал-абад": { latitude: 40.9333, longitude: 72.9833 },
  "жалал-абад": { latitude: 40.9333, longitude: 72.9833 },
  "кадамжай": { latitude: 40.1217, longitude: 71.7197 },
  "кайынды": { latitude: 42.8247, longitude: 73.6757 },
  "кант": { latitude: 42.8911, longitude: 74.8516 },
  "кара-балта": { latitude: 42.8142, longitude: 73.8489 },
  "кара-куль": { latitude: 41.6294, longitude: 72.6685 },
  "кара-суу": { latitude: 40.7046, longitude: 72.8667 },
  "каракол": { latitude: 42.4907, longitude: 78.3936 },
  "кемин": { latitude: 42.7861, longitude: 75.6917 },
  "кербен": { latitude: 41.4938, longitude: 71.7585 },
  "кочкор-ата": { latitude: 41.0378, longitude: 72.4832 },
  "кок-жангак": { latitude: 41.0309, longitude: 73.2054 },
  "кызыл-кия": { latitude: 40.2568, longitude: 72.1266 },
  "майлуу-суу": { latitude: 41.2351, longitude: 72.4436 },
  "нарын": { latitude: 41.4287, longitude: 75.9911 },
  "ноокат": { latitude: 40.2667, longitude: 72.6167 },
  "орловка": { latitude: 42.7476, longitude: 75.5904 },
  "ош": { latitude: 40.514, longitude: 72.8161 },
  "раззаков": { latitude: 39.8386, longitude: 69.5276 },
  "сулюкта": { latitude: 39.9386, longitude: 69.5678 },
  "талас": { latitude: 42.5228, longitude: 72.2427 },
  "таш-кумыр": { latitude: 41.3417, longitude: 72.2171 },
  "токмок": { latitude: 42.8395, longitude: 75.3015 },
  "токтогул": { latitude: 41.8747, longitude: 72.9402 },
  "узген": { latitude: 40.7699, longitude: 73.3007 },
  "чолпон-ата": { latitude: 42.6494, longitude: 77.0822 },
  "шопоков": { latitude: 42.8796, longitude: 74.1138 },
};

function isGoogleMapsEnabled() {
  return Boolean(env.googleMapsServerApiKey);
}

function buildProvidersPayload() {
  const googleEnabled = isGoogleMapsEnabled();

  return {
    geocode: googleEnabled ? "google" : "osm",
    route: googleEnabled ? "google" : "osrm",
    autocomplete: googleEnabled ? "google" : "none",
    language: env.googleMapsLanguage,
    region: env.googleMapsRegion,
  };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Kyzmat/1.0",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Upstream request failed with ${response.status}`);
      error.statusCode = 502;
      error.publicMessage = "Сервис карты временно недоступен. Попробуйте снова чуть позже.";
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      error.statusCode = 504;
      error.publicMessage = "Картографический сервис отвечает слишком долго. Попробуйте снова.";
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseDurationSeconds(durationValue) {
  const normalized = String(durationValue || "").trim();
  if (!normalized) {
    return 0;
  }

  const numericValue = Number.parseFloat(normalized.replace(/s$/i, ""));
  return Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
}

function normalizeCityKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е");
}

async function searchOsm(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "kg");
  url.searchParams.set("q", query);

  const data = await fetchJson(url.toString(), {
    headers: {
      Referer: "https://kyzmat.local",
    },
    timeoutMs: 12000,
  });

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0];
}

function getCityCenterFallback(city) {
  const center = kyrgyzstanCityCenters[normalizeCityKey(city)];
  if (!center) {
    return null;
  }

  return {
    provider: "city-center",
    latitude: center.latitude,
    longitude: center.longitude,
    displayName: `${city}, Кыргызстан`,
    placeId: null,
    approximate: true,
  };
}

async function geocodeWithGoogle(city, address) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");

  url.searchParams.set("address", `${address}, ${city}, Кыргызстан`);
  url.searchParams.set("language", env.googleMapsLanguage);
  url.searchParams.set("region", env.googleMapsCountryCode);
  url.searchParams.set("key", env.googleMapsServerApiKey);

  const data = await fetchJson(url.toString(), { timeoutMs: 12000 });

  if (data?.status === "ZERO_RESULTS") {
    return null;
  }

  if (data?.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
    const error = new Error(`Google geocode failed with status: ${data?.status || "unknown"}`);
    error.statusCode = 502;
    error.publicMessage = "Не удалось определить адрес через Google Maps.";
    throw error;
  }

  const match = data.results[0];

  return {
    provider: "google",
    latitude: Number(match.geometry.location.lat),
    longitude: Number(match.geometry.location.lng),
    displayName: match.formatted_address,
    placeId: match.place_id || null,
  };
}

async function geocodeWithOsm(city, address) {
  const searchQuery = `${address}, ${city}, Кыргызстан`;
  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "kg");
  url.searchParams.set("q", searchQuery);

  const data = await fetchJson(url.toString(), {
    headers: {
      Referer: "https://kyzmat.local",
    },
    timeoutMs: 12000,
  });

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const match = data[0];

  return {
    provider: "osm",
    latitude: Number(match.lat),
    longitude: Number(match.lon),
    displayName: match.display_name,
    placeId: null,
  };
}

async function geocodeWithOsmFallback(city, address) {
  const searchPlans = [
    { query: `${city}, ${address}, Кыргызстан`, approximate: false },
    { query: `${address}, ${city}`, approximate: false },
  ];

  const seenQueries = new Set([normalizeCityKey(`${address}, ${city}, Кыргызстан`)]);

  for (const plan of searchPlans) {
    const normalizedQuery = normalizeCityKey(plan.query);
    if (!normalizedQuery || seenQueries.has(normalizedQuery)) {
      continue;
    }

    seenQueries.add(normalizedQuery);
    const match = await searchOsm(plan.query);

    if (!match) {
      continue;
    }

    return {
      provider: plan.approximate ? "osm-city" : "osm",
      latitude: Number(match.lat),
      longitude: Number(match.lon),
      displayName: match.display_name,
      placeId: null,
      approximate: plan.approximate,
    };
  }

  const cityCenterFallback = getCityCenterFallback(city);
  if (cityCenterFallback) {
    return cityCenterFallback;
  }

  for (const query of [`${city}, Кыргызстан`, city]) {
    const normalizedQuery = normalizeCityKey(query);
    if (!normalizedQuery || seenQueries.has(normalizedQuery)) {
      continue;
    }

    seenQueries.add(normalizedQuery);
    const match = await searchOsm(query);

    if (!match) {
      continue;
    }

    return {
      provider: "osm-city",
      latitude: Number(match.lat),
      longitude: Number(match.lon),
      displayName: match.display_name,
      placeId: null,
      approximate: true,
    };
  }

  return null;
}

async function routeWithGoogle(fromLat, fromLng, toLat, toLng) {
  const data = await fetchJson("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    timeoutMs: 12000,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsServerApiKey,
      "X-Goog-FieldMask":
        "routes.distanceMeters,routes.duration,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions",
    },
    body: {
      origin: {
        location: {
          latLng: {
            latitude: fromLat,
            longitude: fromLng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: toLat,
            longitude: toLng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: env.googleMapsLanguage,
      units: "METRIC",
    },
  });

  const route = Array.isArray(data?.routes) ? data.routes[0] : null;
  if (!route) {
    return null;
  }

  const steps = route.legs?.[0]?.steps || [];

  return {
    provider: "google",
    distanceKm: Number(((route.distanceMeters || 0) / 1000).toFixed(1)),
    durationMinutes: Math.max(1, Math.round(parseDurationSeconds(route.duration) / 60)),
    geometry: [],
    steps: steps.map((step) => ({
      distanceMeters: Math.round(step.distanceMeters || 0),
      durationSeconds: parseDurationSeconds(step.staticDuration),
      name: "",
      ref: "",
      destinations: "",
      mode: "driving",
      instruction: step.navigationInstruction?.instructions || "",
      maneuver: {
        type: "continue",
        modifier: "",
        exit: null,
      },
    })),
  };
}

async function routeWithOsrm(fromLat, fromLng, toLat, toLng) {
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}`);

  url.searchParams.set("overview", "full");
  url.searchParams.set("steps", "true");
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");

  const data = await fetchJson(url.toString(), { timeoutMs: 12000 });

  if (!Array.isArray(data?.routes) || data.routes.length === 0) {
    return null;
  }

  const route = data.routes[0];
  const steps = route.legs?.[0]?.steps || [];

  return {
    provider: "osrm",
    distanceKm: Number((route.distance / 1000).toFixed(1)),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    geometry: Array.isArray(route.geometry?.coordinates)
      ? route.geometry.coordinates.map(([lng, lat]) => ({
          lat: Number(lat),
          lng: Number(lng),
        }))
      : [],
    steps: steps.map((step) => ({
      distanceMeters: Math.round(step.distance || 0),
      durationSeconds: Math.round(step.duration || 0),
      name: step.name || "",
      ref: step.ref || "",
      destinations: step.destinations || "",
      mode: step.mode || "",
      instruction: "",
      maneuver: {
        type: step.maneuver?.type || "",
        modifier: step.maneuver?.modifier || "",
        exit: step.maneuver?.exit || null,
      },
    })),
  };
}

async function autocompleteWithGoogle(input, city, limit) {
  const requestInput = city ? `${input}, ${city}` : input;
  const data = await fetchJson("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    timeoutMs: 12000,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleMapsServerApiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    },
    body: {
      input: requestInput,
      languageCode: env.googleMapsLanguage,
      includedRegionCodes: [env.googleMapsCountryCode.toUpperCase()],
    },
  });

  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];

  return {
    provider: "google",
    suggestions: suggestions
      .map((item) => item.placePrediction)
      .filter(Boolean)
      .slice(0, limit)
      .map((item) => ({
        placeId: item.placeId || null,
        text: item.text?.text || "",
      }))
      .filter((item) => item.text),
  };
}

router.get("/config", (req, res) => {
  res.json(buildProvidersPayload());
});

router.get("/autocomplete", async (req, res, next) => {
  try {
    const { input, city, limit = 5 } = autocompleteSchema.parse(req.query);

    if (!isGoogleMapsEnabled()) {
      return res.json({
        provider: "none",
        suggestions: [],
      });
    }

    try {
      const result = await autocompleteWithGoogle(input, city, limit);
      return res.json(result);
    } catch (error) {
      console.warn("[maps] Google autocomplete failed, returning empty suggestions", error.message);
      return res.json({
        provider: "none",
        suggestions: [],
      });
    }
  } catch (error) {
    return next(error);
  }
});

router.get("/geocode", async (req, res, next) => {
  try {
    const { city, address } = geocodeSchema.parse(req.query);

    if (isGoogleMapsEnabled()) {
      try {
        const googleResult = await geocodeWithGoogle(city, address);
        if (googleResult) {
          return res.json(googleResult);
        }
      } catch (error) {
        console.warn("[maps] Google geocode failed, falling back to OSM", error.message);
      }
    }

    const fallbackResult = (await geocodeWithOsm(city, address)) || (await geocodeWithOsmFallback(city, address));

    if (!fallbackResult) {
      return res.status(404).json({ message: "Не удалось найти этот адрес на карте" });
    }

    return res.json(fallbackResult);
  } catch (error) {
    return next(error);
  }
});

router.get("/route", async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = routeSchema.parse(req.query);

    if (isGoogleMapsEnabled()) {
      try {
        const googleRoute = await routeWithGoogle(fromLat, fromLng, toLat, toLng);
        if (googleRoute) {
          return res.json(googleRoute);
        }
      } catch (error) {
        console.warn("[maps] Google route failed, falling back to OSRM", error.message);
      }
    }

    const fallbackRoute = await routeWithOsrm(fromLat, fromLng, toLat, toLng);

    if (!fallbackRoute) {
      return res.status(404).json({ message: "Не удалось построить маршрут" });
    }

    return res.json(fallbackRoute);
  } catch (error) {
    return next(error);
  }
});

module.exports = { mapsRoutes: router };
