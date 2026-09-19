import type { TemperatureUnit } from "./types.ts";

export interface CurrentWeather {
  temperature: number;
  unit: string;
}

interface ForecastResponse {
  current?: { temperature_2m?: number };
  current_units?: { temperature_2m?: string };
}

export async function getForecast(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
): Promise<CurrentWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("temperature_unit", unit);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener el clima (código ${response.status})`);
  }
  const data = (await response.json()) as ForecastResponse;
  const temperature = data.current?.temperature_2m;
  if (temperature === undefined) {
    throw new Error("La respuesta no incluye la temperatura actual");
  }
  return {
    temperature,
    unit: data.current_units?.temperature_2m ?? (unit === "celsius" ? "°C" : "°F"),
  };
}
