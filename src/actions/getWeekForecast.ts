import { getDailyForecast } from "../api/weather.ts";
import { selectCity } from "../presentation/input.ts";
import {
  error as logError,
  info,
  startSpinner,
  warn,
} from "../presentation/output.ts";
import { findDefaultCity } from "../storage/citiesStorage.ts";
import { cityLabel, errorMessage, formatDay } from "../utils/format.ts";
import { colorTemperature } from "../utils/colors.ts";
import type { AppState } from "../types/AppState.ts";

export async function run(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warn("No hay ciudades guardadas. Agrega una con la opción 4.");
    return;
  }
  let city = findDefaultCity(state);
  if (city === undefined) {
    const picked = await selectCity("Ciudad para el pronóstico:", state.cities);
    if (picked === undefined) {
      warn("Pronóstico cancelado");
      return;
    }
    city = picked;
  }
  const spinner = startSpinner(`Consultando el pronóstico de ${city.name}...`);
  try {
    const days = await getDailyForecast(city.latitude, city.longitude, state.settings.unit);
    spinner.stop(`Pronóstico de 7 días: ${cityLabel(city)}`);
    for (const day of days) {
      const temps = `${day.max} / ${day.min} ${day.unit}`;
      info(`${formatDay(day.date)} → ${colorTemperature(temps)}`);
    }
  } catch (error) {
    spinner.stop();
    logError(errorMessage(error));
  }
}
