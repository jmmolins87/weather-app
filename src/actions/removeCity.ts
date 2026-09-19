import { selectCity } from "../presentation/input.ts";
import { success, warn } from "../presentation/output.ts";
import { removeCity } from "../storage/citiesStorage.ts";
import { cityLabel } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";

export async function run(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warn("No hay ciudades guardadas. Agrega una con la opción 4.");
    return;
  }
  const picked = await selectCity("Ciudad a eliminar:", state.cities);
  if (picked === undefined) {
    warn("Eliminar ciudad cancelado");
    return;
  }
  const removed = await removeCity(state, picked.id);
  success(`Ciudad eliminada: ${removed === undefined ? "" : cityLabel(removed)}`);
}
