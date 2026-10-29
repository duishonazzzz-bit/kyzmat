const googleMapsEmbedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY || "";
const googleMapsLanguage = import.meta.env.VITE_GOOGLE_MAPS_LANGUAGE || "ru";
const googleMapsRegion = import.meta.env.VITE_GOOGLE_MAPS_REGION || "KG";

export function hasGoogleMapsEmbed() {
  return Boolean(googleMapsEmbedApiKey);
}

export function buildGooglePlaceEmbedUrl(destination) {
  if (!hasGoogleMapsEmbed() || !destination) {
    return "";
  }

  const url = new URL("https://www.google.com/maps/embed/v1/place");
  url.searchParams.set("key", googleMapsEmbedApiKey);
  url.searchParams.set("q", `${destination.lat},${destination.lng}`);
  url.searchParams.set("language", googleMapsLanguage);
  url.searchParams.set("region", googleMapsRegion);
  url.searchParams.set("zoom", "16");
  return url.toString();
}

export function buildGoogleDirectionsEmbedUrl(origin, destination) {
  if (!hasGoogleMapsEmbed() || !origin || !destination) {
    return "";
  }

  const url = new URL("https://www.google.com/maps/embed/v1/directions");
  url.searchParams.set("key", googleMapsEmbedApiKey);
  url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destination", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("language", googleMapsLanguage);
  url.searchParams.set("region", googleMapsRegion);
  return url.toString();
}

export function buildGoogleMapsPlaceLink(destination, address = "") {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", address || `${destination?.lat},${destination?.lng}`);
  return url.toString();
}

export function buildGoogleMapsDirectionsLink(origin, destination, address = "") {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");

  if (origin) {
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  }

  url.searchParams.set("destination", address || `${destination?.lat},${destination?.lng}`);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}
