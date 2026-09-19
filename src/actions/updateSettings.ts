import { selectOption } from "../presentation/input.ts";
import { success, warn } from "../presentation/output.ts";
import { setUnit } from "../storage/settingsStorage.ts";
import { unitSymbol } from "../utils/format.ts";
import type { AppState } from "../types/AppState.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export async function run(state: AppState): Promise<void> {
  const picked = await selectOption<TemperatureUnit>("Unidad de temperatura:", [
    {
      value: "celsius",
      label: "Celsius (°C)",
      hint: state.settings.unit === "celsius" ? "actual" : undefined,
    },
    {
      value: "fahrenheit",
      label: "Fahrenheit (°F)",
      hint: state.settings.unit === "fahrenheit" ? "actual" : undefined,
    },
  ]);
  if (picked === undefined) {
    warn("Ajustes cancelados");
    return;
  }
  await setUnit(state, picked);
  success(`Unidad guardada: ${unitSymbol(picked)}`);
}
