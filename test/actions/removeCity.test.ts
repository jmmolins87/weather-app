import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/removeCity.ts";
import { loadState } from "../../src/storage/state.ts";
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

function stateWith(cities: City[], defaultCityId?: number): AppState {
  return { cities: [...cities], settings: { unit: "celsius" }, defaultCityId };
}

describe("removeCity action", () => {
  test("avisa cuando no hay ciudades y no pregunta nada", async () => {
    await run(stateWith([]));
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudades guardadas. Agrega una con la opción 4.",
      },
    ]);
    expect(promptsState.selectCalls).toHaveLength(0);
  });

  test("cancelar no elimina nada", async () => {
    const state = stateWith([bogota, madrid], 1);
    answerSelect(CANCEL);
    await run(state);
    expect(state.cities).toEqual([bogota, madrid]);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Eliminar ciudad cancelado" },
    ]);
  });

  test("elimina la ciudad elegida, limpia el default y persiste", async () => {
    const state = stateWith([bogota, madrid], 1);
    answerSelect(bogota);
    await run(state);
    expect(state.cities).toEqual([madrid]);
    expect(state.defaultCityId).toBeUndefined();
    expect(promptsState.logs).toEqual([
      {
        level: "success",
        message: "Ciudad eliminada: Bogotá, Bogotá D.C., Colombia",
      },
    ]);
    expect(await loadState()).toEqual(state);
    expect(promptsState.selectCalls[0]?.message).toBe("Ciudad a eliminar:");
  });
});
