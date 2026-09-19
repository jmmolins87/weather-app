import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import { mockFetchError, mockFetchJson, promptsState, useIsolatedTestEnv } from "../helpers.ts";
import { run } from "../../src/actions/getAllCitiesWeather.ts";
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

function stateWith(cities: City[]): AppState {
  return { cities: [...cities], settings: { unit: "celsius" } };
}

function currentBody(temperature: number): unknown {
  return {
    current: { temperature_2m: temperature },
    current_units: { temperature_2m: "°C" },
  };
}

describe("getAllCitiesWeather action", () => {
  test("sin ciudades avisa y no consulta nada", async () => {
    const { urls } = mockFetchJson({});
    await run(stateWith([]));
    expect(urls).toHaveLength(0);
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudades guardadas. Agrega una con la opción 4.",
      },
    ]);
  });

  test("muestra el clima de cada ciudad", async () => {
    const { urls } = mockFetchJson((url: string) => {
      const latitude = new URL(url).searchParams.get("latitude");
      return currentBody(latitude === "40.41" ? 25 : 20);
    });
    await run(stateWith([bogota, madrid]));
    expect(urls).toHaveLength(2);
    expect(promptsState.spinnerStarts).toEqual([
      "Consultando el clima de 2 ciudades...",
    ]);
    expect(promptsState.spinnerStops).toEqual([undefined]);
    const infos = promptsState.logs.filter((entry) => entry.level === "info");
    expect(infos).toHaveLength(2);
    expect(infos[0]?.message).toContain("Bogotá");
    expect(infos[0]?.message).toContain("20");
    expect(infos[1]?.message).toContain("Madrid");
    expect(infos[1]?.message).toContain("25");
  });

  test("una ciudad con error no impide mostrar las demás", async () => {
    mockFetchJson((url: string) => {
      const latitude = new URL(url).searchParams.get("latitude");
      if (latitude === "40.41") {
        return { body: {}, status: 500 };
      }
      return currentBody(20);
    });
    await run(stateWith([bogota, madrid]));
    const infos = promptsState.logs.filter((entry) => entry.level === "info");
    const errors = promptsState.logs.filter((entry) => entry.level === "error");
    expect(infos).toHaveLength(1);
    expect(infos[0]?.message).toContain("Bogotá");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("Madrid");
    expect(errors[0]?.message).toContain("500");
  });

  test("fetch sin mockear también funciona cuando la red falla", async () => {
    mockFetchError(500);
    await run(stateWith([bogota]));
    expect(promptsState.logs).toEqual([
      {
        level: "error",
        message: "Bogotá, Bogotá D.C., Colombia → Error al obtener el clima (código 500)",
      },
    ]);
  });
});
