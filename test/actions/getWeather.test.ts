import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  mockFetchError,
  mockFetchJson,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/getWeather.ts";
import type { AppState } from "../../src/types/AppState.ts";
import type { City } from "../../src/types/City.ts";

useIsolatedTestEnv();

const bogota: City = {
  id: 1,
  name: "Bogotá",
  country: "Colombia",
  admin1: "Bogotá D.C.",
  latitude: 4.6,
  longitude: -74.08,
  population: 7_000_000,
};

describe("getWeather action", () => {
  test("sin ciudad default avisa y no consulta nada", async () => {
    const { urls } = mockFetchJson({});
    const state: AppState = {
      cities: [bogota],
      settings: { unit: "celsius" },
    };
    await run(state);
    expect(urls).toHaveLength(0);
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudad default. Agrégalas con la opción 4 y establécela con la 6.",
      },
    ]);
  });

  test("muestra el clima de la ciudad default", async () => {
    mockFetchJson({
      current: { temperature_2m: 21.5 },
      current_units: { temperature_2m: "°C" },
    });
    const state: AppState = {
      cities: [bogota],
      settings: { unit: "celsius" },
      defaultCityId: 1,
    };
    await run(state);
    expect(promptsState.spinnerStarts).toEqual(["Consultando el clima de Bogotá..."]);
    expect(promptsState.spinnerStops).toHaveLength(1);
    expect(promptsState.spinnerStops[0]).toContain("21.5");
    expect(promptsState.spinnerStops[0]).toContain("Bogotá, Bogotá D.C., Colombia");
  });

  test("error de la API muestra el error sin lanzar", async () => {
    mockFetchError(503);
    const state: AppState = {
      cities: [bogota],
      settings: { unit: "celsius" },
      defaultCityId: 1,
    };
    await run(state);
    expect(promptsState.spinnerStops).toEqual([undefined]);
    expect(promptsState.logs).toEqual([
      { level: "error", message: "Error al obtener el clima (código 503)" },
    ]);
  });
});
