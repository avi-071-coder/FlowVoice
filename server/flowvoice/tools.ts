export interface RestaurantQuery { location: string; dietary?: string; budget?: string; rating?: string; openNow?: boolean; }
export interface RestaurantResult { name: string; address: string; rating: number; price: string; tags: string[]; source: "google-places" | "demo-fixture"; }
export interface WeatherResult { location: string; temperatureC: number; condition: string; source: "open-meteo" | "demo-fixture"; }
export interface ConfirmationRequest { action: string; summary: string; requiresConfirmation: true; token: string; }

const demoRestaurants: RestaurantResult[] = [
  { name: "The Green Room", address: "Salt Lake · Sector V", rating: 4.6, price: "₹₹", tags: ["Vegetarian", "Open now"], source: "demo-fixture" },
  { name: "Kolkata Social Kitchen", address: "Park Street · 2.1 km", rating: 4.4, price: "₹", tags: ["Under ₹800", "Open now"], source: "demo-fixture" },
  { name: "Sienna Supper Club", address: "Ballygunge · 3.4 km", rating: 4.3, price: "₹₹", tags: ["Vegetarian options", "Open till 11 PM"], source: "demo-fixture" },
];

/** Server-side adapter: use live Google Places when configured, otherwise keep demo mode explicit. */
export async function searchRestaurants(query: RestaurantQuery): Promise<RestaurantResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return demoRestaurants.filter((item) => query.dietary ? item.tags.some((tag) => tag.toLowerCase().includes(query.dietary!.toLowerCase())) : true);
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.priceLevel" }, body: JSON.stringify({ textQuery: `${query.dietary ?? ""} restaurants in ${query.location}`, maxResultCount: 5, languageCode: "en" }) });
  if (!response.ok) throw new Error(`Google Places failed with ${response.status}`);
  const payload = await response.json() as { places?: Array<{ displayName?: { text?: string }; formattedAddress?: string; rating?: number; priceLevel?: string }> };
  return (payload.places ?? []).map((place) => ({ name: place.displayName?.text ?? "Unnamed place", address: place.formattedAddress ?? query.location, rating: place.rating ?? 0, price: place.priceLevel?.replace("PRICE_LEVEL_", "") ?? "—", tags: query.dietary ? [query.dietary] : [], source: "google-places" as const }));
}

export async function getWeather(location: string): Promise<WeatherResult> {
  const demo: WeatherResult = { location, temperatureC: 28, condition: "Partly cloudy", source: "demo-fixture" };
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const place = (await geo.json() as { results?: Array<{ latitude: number; longitude: number; name: string }> }).results?.[0];
    if (!place) return demo;
    const forecast = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`);
    const current = (await forecast.json() as { current?: { temperature_2m?: number; weather_code?: number } }).current;
    return { location: place.name, temperatureC: current?.temperature_2m ?? 0, condition: `Weather code ${current?.weather_code ?? 0}`, source: "open-meteo" };
  } catch { return demo; }
}

export function requestConfirmation(action: string, summary: string): ConfirmationRequest {
  return { action, summary, requiresConfirmation: true, token: `confirm-${crypto.randomUUID()}` };
}
