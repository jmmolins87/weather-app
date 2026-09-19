import * as p from "@clack/prompts";
import { run as runAddCity } from "../actions/addCity.ts";
import { run as runAllCitiesWeather } from "../actions/getAllCitiesWeather.ts";
import { run as runDefaultWeather } from "../actions/getWeather.ts";
import { run as runListCities } from "../actions/listCities.ts";
import { run as runRemoveCity } from "../actions/removeCity.ts";
import { run as runSetDefaultCity } from "../actions/setDefaultCity.ts";
import { run as runUpdateSettings } from "../actions/updateSettings.ts";
import { run as runWeekForecast } from "../actions/getWeekForecast.ts";
import { findDefaultCity } from "../storage/citiesStorage.ts";
import { loadState } from "../storage/state.ts";
import { cityLabel, unitSymbol } from "../utils/format.ts";
import { showBanner } from "./output.ts";
import type { AppState } from "../types/AppState.ts";
import type { MenuOption } from "../types/MenuOption.ts";

// Para agregar una funcionalidad nueva basta con añadir una entrada aquí:
// la numeración del menú se genera sola y el bucle de main() la ejecuta.
const MENU_OPTIONS: MenuOption[] = [
  {
    value: "default",
    label: () => "Clima de ciudad default",
    hint: (state) => {
      const city = findDefaultCity(state);
      return city === undefined ? "sin establecer" : cityLabel(city);
    },
    run: runDefaultWeather,
  },
  {
    value: "all",
    label: (state) => `Clima de todas las ciudades (${state.cities.length})`,
    run: runAllCitiesWeather,
  },
  { value: "list", label: () => "Listar ciudades guardadas", run: runListCities },
  { value: "search", label: () => "Buscar y agregar ciudad", run: runAddCity },
  { value: "delete", label: () => "Eliminar ciudad", run: runRemoveCity },
  {
    value: "set-default",
    label: () => "Establecer ciudad default",
    run: runSetDefaultCity,
  },
  { value: "week", label: () => "Pronóstico 7 días", run: runWeekForecast },
  {
    value: "settings",
    label: (state) => `Ajustes (${unitSymbol(state.settings.unit)})`,
    run: runUpdateSettings,
  },
  { value: "exit", label: () => "Salir" },
];

function menuOptions(state: AppState) {
  return MENU_OPTIONS.map((option, index) => ({
    value: option.value,
    label: `${index + 1}. ${option.label(state)}`,
    hint: option.hint?.(state),
  }));
}

export async function main(): Promise<void> {
  const state = await loadState();
  showBanner();
  for (;;) {
    const choice = await p.select({
      message: "Selecciona una opción",
      options: menuOptions(state),
    });
    if (p.isCancel(choice)) {
      break;
    }
    const command = MENU_OPTIONS.find((c) => c.value === choice);
    if (command === undefined || command.run === undefined) {
      break;
    }
    await command.run(state);
  }
  p.outro("¡Hasta luego!");
}
