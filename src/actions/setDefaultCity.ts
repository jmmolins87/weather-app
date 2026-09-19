import { selectCity } from "../presentation/input.ts";
import { success, warn } from "../presentation/output.ts";
import { setDefaultCity } from "../storage/citiesStorage.ts";
import { cityLabel } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";

export async function run(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warn("No hay ciudades guardadas. Agrega una con la opción 4.");
    return;
  }
  const picked = await selectCity(
    "Nueva ciudad default:",
    state.cities,
    (city) => (city.id === state.defaultCityId ? "actual" : undefined),
  );
  if (picked === undefined) {
    warn("Cambio de ciudad default cancelado");
    return;
  }
  const city = await setDefaultCity(state, picked.id);
  success(`Ciudad default: ${city === undefined ? "" : cityLabel(city)}`);
}
