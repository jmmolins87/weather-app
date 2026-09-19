import * as p from "@clack/prompts";
import pc from "picocolors";
import { getDailyForecast, getForecast } from "./forecast.ts";
import { searchCities } from "./geocoding.ts";
import { loadState, saveState } from "./storage.ts";
import type { AppState, City, TemperatureUnit } from "./types.ts";

const BANNER_WIDTH = 40;

function banner(): void {
  const border = "═".repeat(BANNER_WIDTH);
  const title = "WEATHER CLI";
  const centered = title
    .padStart(Math.floor((BANNER_WIDTH + title.length) / 2))
    .padEnd(BANNER_WIDTH);
  console.log(pc.cyan(`${border}\n${pc.bold(centered)}\n${border}`));
}

function cityLabel(city: City): string {
  return [city.name, city.admin1, city.country]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function menuOptions(state: AppState) {
  const defaultCity = state.cities.find((city) => city.id === state.defaultCityId);
  const unitSymbol = state.settings.unit === "celsius" ? "°C" : "°F";
  return [
    {
      value: "default",
      label: "1. Clima de ciudad default",
      hint: defaultCity === undefined ? "sin establecer" : cityLabel(defaultCity),
    },
    { value: "all", label: `2. Clima de todas las ciudades (${state.cities.length})` },
    { value: "search", label: "3. Buscar y agregar ciudad" },
    { value: "delete", label: "4. Eliminar ciudad" },
    { value: "set-default", label: "5. Establecer ciudad default" },
    { value: "week", label: "6. Pronóstico 7 días" },
    { value: "settings", label: `8. Ajustes (${unitSymbol})` },
    { value: "exit", label: "9. Salir" },
  ];
}

async function showWeather(city: City, unit: TemperatureUnit): Promise<void> {
  const spinner = p.spinner();
  spinner.start(`Consultando el clima de ${city.name}...`);
  try {
    const weather = await getForecast(city.latitude, city.longitude, unit);
    spinner.stop(`${cityLabel(city)} → ${pc.yellow(`${weather.temperature} ${weather.unit}`)}`);
  } catch (error) {
    spinner.stop();
    p.log.error(pc.red(errorMessage(error)));
  }
}

async function handleDefaultWeather(state: AppState): Promise<void> {
  const city = state.cities.find((c) => c.id === state.defaultCityId);
  if (city === undefined) {
    p.log.warn("No hay ciudad default. Agrégalas con la opción 3 y establécela con la 5.");
    return;
  }
  await showWeather(city, state.settings.unit);
}

async function handleAllCities(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    p.log.warn("No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }
  const spinner = p.spinner();
  spinner.start(`Consultando el clima de ${state.cities.length} ciudades...`);
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
      p.log.info(`${cityLabel(city)} → ${pc.yellow(`${result.value.temperature} ${result.value.unit}`)}`);
    } else {
      p.log.error(`${cityLabel(city)} → ${pc.red(errorMessage(result.reason))}`);
    }
  }
}

async function handleSearchAdd(state: AppState): Promise<void> {
  const query = await p.text({
    message: "Nombre de la ciudad a buscar:",
    placeholder: "Ej. Bogotá",
    validate(value) {
      if (value === undefined || value.trim() === "") {
        return "Ingresa un nombre de ciudad";
      }
    },
  });
  if (p.isCancel(query)) {
    p.log.warn("Búsqueda cancelada");
    return;
  }
  const spinner = p.spinner();
  spinner.start(`Buscando "${query.trim()}"...`);
  let results: City[];
  try {
    results = await searchCities(query.trim());
  } catch (error) {
    spinner.stop();
    p.log.error(pc.red(errorMessage(error)));
    return;
  }
  spinner.stop(results.length > 0 ? `Encontradas ${results.length} coincidencias` : undefined);
  if (results.length === 0) {
    p.log.warn("No se encontraron ciudades con ese nombre.");
    return;
  }
  const pending = results.filter((city) => !state.cities.some((saved) => saved.id === city.id));
  if (pending.length === 0) {
    p.log.warn("Todas las coincidencias ya están guardadas.");
    return;
  }
  const picked = await p.select({
    message: "Ciudad a agregar:",
    options: pending.map((city) => ({ value: city, label: cityLabel(city) })),
  });
  if (p.isCancel(picked)) {
    p.log.warn("Agregar ciudad cancelado");
    return;
  }
  state.cities.push(picked);
  await saveState(state);
  p.log.success(pc.green(`Ciudad agregada: ${cityLabel(picked)}`));
}

async function handleDelete(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    p.log.warn("No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }
  const picked = await p.select({
    message: "Ciudad a eliminar:",
    options: state.cities.map((city) => ({ value: city.id, label: cityLabel(city) })),
  });
  if (p.isCancel(picked)) {
    p.log.warn("Eliminar ciudad cancelado");
    return;
  }
  const city = state.cities.find((c) => c.id === picked);
  state.cities = state.cities.filter((c) => c.id !== picked);
  if (state.defaultCityId === picked) {
    state.defaultCityId = undefined;
  }
  await saveState(state);
  p.log.success(pc.green(`Ciudad eliminada: ${city === undefined ? "" : cityLabel(city)}`));
}

async function handleSetDefault(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    p.log.warn("No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }
  const picked = await p.select({
    message: "Nueva ciudad default:",
    options: state.cities.map((city) => ({
      value: city.id,
      label: cityLabel(city),
      hint: city.id === state.defaultCityId ? "actual" : undefined,
    })),
  });
  if (p.isCancel(picked)) {
    p.log.warn("Cambio de ciudad default cancelado");
    return;
  }
  state.defaultCityId = picked;
  await saveState(state);
  const city = state.cities.find((c) => c.id === picked);
  p.log.success(pc.green(`Ciudad default: ${city === undefined ? "" : cityLabel(city)}`));
}

const dayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return dayFormatter.format(parsed);
}

async function handleWeekForecast(state: AppState): Promise<void> {
  if (state.cities.length === 0) {
    p.log.warn("No hay ciudades guardadas. Agrega una con la opción 3.");
    return;
  }
  let city = state.cities.find((c) => c.id === state.defaultCityId);
  if (city === undefined) {
    const picked = await p.select({
      message: "Ciudad para el pronóstico:",
      options: state.cities.map((c) => ({ value: c, label: cityLabel(c) })),
    });
    if (p.isCancel(picked)) {
      p.log.warn("Pronóstico cancelado");
      return;
    }
    city = picked;
  }
  const spinner = p.spinner();
  spinner.start(`Consultando el pronóstico de ${city.name}...`);
  try {
    const days = await getDailyForecast(city.latitude, city.longitude, state.settings.unit);
    spinner.stop(`Pronóstico de 7 días: ${cityLabel(city)}`);
    for (const day of days) {
      const temps = `${day.max} / ${day.min} ${day.unit}`;
      p.log.info(`${formatDay(day.date)} → ${pc.yellow(temps)}`);
    }
  } catch (error) {
    spinner.stop();
    p.log.error(pc.red(errorMessage(error)));
  }
}

async function handleSettings(state: AppState): Promise<void> {
  const picked = await p.select({
    message: "Unidad de temperatura:",
    options: [
      {
        value: "celsius" as TemperatureUnit,
        label: "Celsius (°C)",
        hint: state.settings.unit === "celsius" ? "actual" : undefined,
      },
      {
        value: "fahrenheit" as TemperatureUnit,
        label: "Fahrenheit (°F)",
        hint: state.settings.unit === "fahrenheit" ? "actual" : undefined,
      },
    ],
  });
  if (p.isCancel(picked)) {
    p.log.warn("Ajustes cancelados");
    return;
  }
  state.settings.unit = picked;
  await saveState(state);
  p.log.success(pc.green(`Unidad guardada: ${picked === "celsius" ? "°C" : "°F"}`));
}

export async function main(): Promise<void> {
  const state = await loadState();
  banner();
  for (;;) {
    const choice = await p.select({
      message: "Selecciona una opción",
      options: menuOptions(state),
    });
    if (p.isCancel(choice) || choice === "exit") {
      break;
    }
    switch (choice) {
      case "default":
        await handleDefaultWeather(state);
        break;
      case "all":
        await handleAllCities(state);
        break;
      case "search":
        await handleSearchAdd(state);
        break;
      case "delete":
        await handleDelete(state);
        break;
      case "set-default":
        await handleSetDefault(state);
        break;
      case "week":
        await handleWeekForecast(state);
        break;
      case "settings":
        await handleSettings(state);
        break;
    }
  }
  p.outro("¡Hasta luego!");
}
