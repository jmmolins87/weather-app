import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import { promptsState, useIsolatedTestEnv } from "../helpers.ts";
import { run } from "../../src/actions/listCities.ts";
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

describe("listCities action", () => {
  test("sin ciudades avisa", async () => {
    await run({ cities: [], settings: { unit: "celsius" } });
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudades guardadas. Agrega una con la opción 4.",
      },
    ]);
  });

  test("lista cada ciudad con población y marca la default", async () => {
    const state: AppState = {
      cities: [bogota, madrid],
      settings: { unit: "celsius" },
      defaultCityId: 1,
    };
    await run(state);
    const infos = promptsState.logs.filter((entry) => entry.level === "info");
    expect(infos).toHaveLength(2);
    expect(infos[0]?.message).toContain("Bogotá, Bogotá D.C., Colombia");
    expect(infos[0]?.message).toContain("habitantes");
    expect(infos[0]?.message).toContain("★ default");
    expect(infos[1]).toEqual({ level: "info", message: "Madrid, Madrid, España" });
  });
});
