import { getForecast } from "../api/weather.ts";
import {
  error as logError,
  startSpinner,
  warn,
  weatherLine,
} from "../presentation/output.ts";
import { cityLabel, errorMessage } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";

export async function run(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warn("No hay ciudades guardadas. Agrega una con la opción 4.");
    return;
  }
  const spinner = startSpinner(`Consultando el clima de ${state.cities.length} ciudades...`);
  const results = await Promise.allSettled(
    state.cities.map((city) => getForecast(city.latitude, city.longitude, state.settings.unit)),
  );
  spinner.stop();
  for (const [index, city] of state.cities.entries()) {
    const result = results[index];
    if (result === undefined) {
      continue;
    }
    if (result.status === "fulfilled") {
      weatherLine(city, result.value);
    } else {
      logError(`${cityLabel(city)} → ${errorMessage(result.reason)}`);
    }
  }
}
