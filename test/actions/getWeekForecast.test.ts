import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  mockFetchError,
  mockFetchJson,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/getWeekForecast.ts";
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

const madrid: City = {
  id: 2,
  name: "Madrid",
  country: "España",
  admin1: "Madrid",
  latitude: 40.41,
  longitude: -3.7,
};

const dailyBody = {
  daily: {
    time: ["2026-01-01", "2026-01-02"],
    temperature_2m_max: [25, 26],
    temperature_2m_min: [15, 16],
  },
  daily_units: { temperature_2m_max: "°C" },
};

function stateWith(cities: City[], defaultCityId?: number): AppState {
  return { cities: [...cities], settings: { unit: "celsius" }, defaultCityId };
}

describe("getWeekForecast action", () => {
  test("sin ciudades avisa y no consulta nada", async () => {
    const { urls } = mockFetchJson(dailyBody);
    await run(stateWith([]));
    expect(urls).toHaveLength(0);
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudades guardadas. Agrega una con la opción 4.",
      },
    ]);
  });

  test("con ciudad default no pregunta y muestra los 7 días", async () => {
    const { urls } = mockFetchJson(dailyBody);
    await run(stateWith([bogota, madrid], 1));
    expect(urls).toHaveLength(1);
    expect(promptsState.selectCalls).toHaveLength(0);
    expect(promptsState.spinnerStarts).toEqual([
      "Consultando el pronóstico de Bogotá...",
    ]);
    expect(promptsState.spinnerStops).toEqual([
      "Pronóstico de 7 días: Bogotá, Bogotá D.C., Colombia",
    ]);
    const infos = promptsState.logs.filter((entry) => entry.level === "info");
    expect(infos).toHaveLength(2);
    expect(infos[0]?.message).toContain("25 / 15 °C");
    expect(infos[1]?.message).toContain("26 / 16 °C");
  });

  test("sin ciudad default pregunta cuál usar", async () => {
    mockFetchJson(dailyBody);
    answerSelect(madrid);
    await run(stateWith([bogota, madrid]));
    expect(promptsState.selectCalls[0]?.message).toBe("Ciudad para el pronóstico:");
    expect(promptsState.spinnerStarts).toEqual([
      "Consultando el pronóstico de Madrid...",
    ]);
    expect(promptsState.spinnerStops[0]).toContain("Madrid, Madrid, España");
  });

  test("cancelar la selección no consulta nada", async () => {
    const { urls } = mockFetchJson(dailyBody);
    answerSelect(CANCEL);
    await run(stateWith([bogota]));
    expect(urls).toHaveLength(0);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Pronóstico cancelado" },
    ]);
  });

  test("error de la API muestra el error sin lanzar", async () => {
    mockFetchError(500);
    await run(stateWith([bogota], 1));
    expect(promptsState.spinnerStops).toEqual([undefined]);
    expect(promptsState.logs).toEqual([
      { level: "error", message: "Error al obtener el pronóstico (código 500)" },
    ]);
  });
});
