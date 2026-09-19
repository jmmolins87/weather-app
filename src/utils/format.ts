import type { City } from "../types/City.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
}

export function populationHint(city: City): string | undefined {
  if (city.population === undefined || city.population <= 0) {
    return undefined;
  }
  const formatted = new Intl.NumberFormat("es", { notation: "compact" }).format(
    city.population,
  );
  return `≈ ${formatted} habitantes`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function unitSymbol(unit: TemperatureUnit): string {
  return unit === "celsius" ? "°C" : "°F";
}

const dayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return dayFormatter.format(parsed);
}
