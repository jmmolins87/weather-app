import { searchCities } from "../api/geocoding.ts";
import { promptText, selectCity } from "../presentation/input.ts";
import {
  error as logError,
  startSpinner,
  success,
  warn,
} from "../presentation/output.ts";
import { addCity } from "../storage/citiesStorage.ts";
import { cityLabel, errorMessage, populationHint } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";
import type { City } from "../types/City.ts";

export async function run(state: AppState): Promise<void> {
  const query = await promptText(
    "Nombre de la ciudad a buscar:",
    "Ej. Bogotá",
    "Ingresa un nombre de ciudad",
  );
  if (query === undefined) {
    warn("Búsqueda cancelada");
    return;
  }
  const spinner = startSpinner(`Buscando "${query}"...`);
  let results: City[];
  try {
    results = await searchCities(query);
  } catch (error) {
    spinner.stop();
    logError(errorMessage(error));
    return;
  }
  spinner.stop(results.length > 0 ? `Encontradas ${results.length} coincidencias` : undefined);
  if (results.length === 0) {
    warn("No se encontraron ciudades con ese nombre.");
    return;
  }
  const pending = results.filter((city) => !state.cities.some((saved) => saved.id === city.id));
  if (pending.length === 0) {
    warn("Todas las coincidencias ya están guardadas.");
    return;
  }
  const picked = await selectCity("Ciudad a agregar:", pending, populationHint);
  if (picked === undefined) {
    warn("Agregar ciudad cancelado");
    return;
  }
  await addCity(state, picked);
  success(`Ciudad agregada: ${cityLabel(picked)}`);
}
