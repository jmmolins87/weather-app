import { info, warn } from "../presentation/output.ts";
import { cityLabel, populationHint } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";

export async function run(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    warn("No hay ciudades guardadas. Agrega una con la opción 4.");
    return;
  }
  for (const city of state.cities) {
    const parts = [cityLabel(city)];
    const hint = populationHint(city);
    if (hint !== undefined) {
      parts.push(hint);
    }
    if (city.id === state.defaultCityId) {
      parts.push("★ default");
    }
    info(parts.join(" — "));
  }
}
