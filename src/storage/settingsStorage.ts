import { saveState } from "./state.ts";
import type { AppState } from "../types/AppState.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export async function setUnit(state: AppState, unit: TemperatureUnit): Promise<void> {
  state.settings.unit = unit;
  await saveState(state);
}
