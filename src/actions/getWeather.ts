import { getForecast } from "../api/weather.ts";
import { error as logError, startSpinner, warn, weatherMessage } from "../presentation/output.ts";
import { findDefaultCity } from "../storage/citiesStorage.ts";
import { cityLabel, errorMessage } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";
import type { City } from "../types/City.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

async function showWeather(city: City, unit: TemperatureUnit): Promise<void> {
  const spinner = startSpinner(`Consultando el clima de ${city.name}...`);
  try {
    const weather = await getForecast(city.latitude, city.longitude, unit);
    spinner.stop(weatherMessage(city, weather));
  } catch (error) {
    spinner.stop();
    logError(errorMessage(error));
  }
}

export async function run(state: AppState): Promise<void> {
  const city = findDefaultCity(state);
  if (city === undefined) {
    warn("No hay ciudad default. Agrégalas con la opción 4 y establécela con la 6.");
    return;
  }
  await showWeather(city, state.settings.unit);
}
