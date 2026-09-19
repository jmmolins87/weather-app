import type { City } from "./types.ts";

interface GeocodingResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  population?: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

export async function searchCities(query: string): Promise<City[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al buscar la ciudad (código ${response.status})`);
  }
  const data = (await response.json()) as GeocodingResponse;
  const seen = new Set<string>();
  const cities: City[] = [];
  for (const result of data.results ?? []) {
    const admin1 = result.admin1;
    const country = result.country ?? "";
    const key = [result.name, admin1 ?? "", country, result.population ?? 0].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    cities.push({
      id: result.id,
      name: result.name,
      country,
      admin1,
      latitude: result.latitude,
      longitude: result.longitude,
      population: result.population,
    });
  }
  return cities;
}
