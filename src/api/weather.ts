import { FORECAST_API_URL } from "../utils/constants.ts";
import type {
  CurrentWeather,
  DailyForecast,
  TemperatureUnit,
} from "../types/Weather.ts";

interface ForecastResponse {
  current?: { temperature_2m?: number };
  current_units?: { temperature_2m?: string };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  daily_units?: { temperature_2m_max?: string };
}

export async function getForecast(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
): Promise<CurrentWeather> {
  const url = new URL(FORECAST_API_URL);
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

export async function getDailyForecast(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
): Promise<DailyForecast[]> {
  const url = new URL(FORECAST_API_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("temperature_unit", unit);
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener el pronóstico (código ${response.status})`);
  }
  const data = (await response.json()) as ForecastResponse;
  const times = data.daily?.time ?? [];
  const maxTemps = data.daily?.temperature_2m_max ?? [];
  const minTemps = data.daily?.temperature_2m_min ?? [];
  if (times.length === 0) {
    throw new Error("La respuesta no incluye el pronóstico diario");
  }
  const unitSymbol =
    data.daily_units?.temperature_2m_max ?? (unit === "celsius" ? "°C" : "°F");
  const days: DailyForecast[] = [];
  for (const [index, date] of times.entries()) {
    const max = maxTemps[index];
    const min = minTemps[index];
    if (max === undefined || min === undefined) {
      continue;
    }
    days.push({ date, max, min, unit: unitSymbol });
  }
  return days;
}
