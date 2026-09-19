import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  answerText,
  mockFetchError,
  mockFetchJson,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/addCity.ts";
import { loadState } from "../../src/storage/state.ts";
import type { AppState } from "../../src/types/AppState.ts";
import type { City } from "../../src/types/City.ts";

useIsolatedTestEnv();

const city1: City = {
  id: 1,
  name: "Bogotá",
  country: "Colombia",
  admin1: "Bogotá D.C.",
  latitude: 4.6,
  longitude: -74.08,
  population: 7_000_000,
};

const city2: City = {
  id: 2,
  name: "Bogotá",
  country: "Colombia",
  admin1: "Bogotá D.C.",
  latitude: 4.7,
  longitude: -74.0,
  population: 500_000,
};

const apiResults = {
  results: [
    {
      id: 1,
      name: "Bogotá",
      country: "Colombia",
      admin1: "Bogotá D.C.",
      latitude: 4.6,
      longitude: -74.08,
      population: 7_000_000,
    },
    {
      id: 2,
      name: "Bogotá",
      country: "Colombia",
      admin1: "Bogotá D.C.",
      latitude: 4.7,
      longitude: -74.0,
      population: 500_000,
    },
  ],
};

function emptyState(): AppState {
  return { cities: [], settings: { unit: "celsius" } };
}

describe("addCity action", () => {
  test("cancelar la búsqueda no llama a la API", async () => {
    const { urls } = mockFetchJson(apiResults);
    answerText(CANCEL);
    await run(emptyState());
    expect(urls).toHaveLength(0);
    expect(promptsState.logs).toEqual([{ level: "warn", message: "Búsqueda cancelada" }]);
  });

  test("error de la API muestra el error sin pedir selección", async () => {
    mockFetchError(500);
    answerText("bogota");
    await run(emptyState());
    expect(promptsState.spinnerStops).toEqual([undefined]);
    expect(promptsState.logs).toEqual([
      { level: "error", message: "Error al buscar la ciudad (código 500)" },
    ]);
    expect(promptsState.selectCalls).toHaveLength(0);
  });

  test("sin resultados avisa y termina", async () => {
    mockFetchJson({ results: [] });
    answerText("xyzzy");
    const state = emptyState();
    await run(state);
    expect(state.cities).toHaveLength(0);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "No se encontraron ciudades con ese nombre." },
    ]);
  });

  test("avisa cuando todo ya está guardado", async () => {
    mockFetchJson(apiResults);
    answerText("bogota");
    const state: AppState = { ...emptyState(), cities: [city1, city2] };
    await run(state);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Todas las coincidencias ya están guardadas." },
    ]);
    expect(promptsState.selectCalls).toHaveLength(0);
  });

  test("cancelar la selección no guarda nada", async () => {
    mockFetchJson(apiResults);
    answerText("bogota");
    answerSelect(CANCEL);
    const state: AppState = { ...emptyState(), cities: [city1] };
    await run(state);
    expect(state.cities).toEqual([city1]);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Agregar ciudad cancelado" },
    ]);
  });

  test("agrega la ciudad elegida, filtra las guardadas y persiste", async () => {
    mockFetchJson(apiResults);
    answerText("  bogota  ");
    answerSelect(city2);
    const state: AppState = { ...emptyState(), cities: [city1] };
    await run(state);
    // Solo se ofrece la coincidencia pendiente.
    expect(promptsState.selectCalls[0]?.message).toBe("Ciudad a agregar:");
    expect(promptsState.selectCalls[0]?.options).toHaveLength(1);
    expect(promptsState.selectCalls[0]?.options[0]?.value).toEqual(city2);
    expect(state.cities).toEqual([city1, city2]);
    expect(promptsState.logs).toEqual([
      {
        level: "success",
        message: "Ciudad agregada: Bogotá, Bogotá D.C., Colombia",
      },
    ]);
    expect(await loadState()).toEqual(state);
  });
});
