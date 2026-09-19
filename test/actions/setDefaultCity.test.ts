import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/setDefaultCity.ts";
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

describe("setDefaultCity action", () => {
  test("sin ciudades avisa y no pregunta nada", async () => {
    await run(stateWith([]));
    expect(promptsState.logs).toEqual([
      {
        level: "warn",
        message: "No hay ciudades guardadas. Agrega una con la opción 4.",
      },
    ]);
    expect(promptsState.selectCalls).toHaveLength(0);
  });

  test("cancelar no cambia el default", async () => {
    const state = stateWith([bogota, madrid], 1);
    answerSelect(CANCEL);
    await run(state);
    expect(state.defaultCityId).toBe(1);
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Cambio de ciudad default cancelado" },
    ]);
  });

  test("establece el default, marca la actual y persiste", async () => {
    const state = stateWith([bogota, madrid], 1);
    answerSelect(madrid);
    await run(state);
    expect(promptsState.selectCalls[0]?.message).toBe("Nueva ciudad default:");
    const options = promptsState.selectCalls[0]?.options ?? [];
    expect(options.find((o) => (o.value as City).id === 1)?.hint).toBe("actual");
    expect(options.find((o) => (o.value as City).id === 2)?.hint).toBeUndefined();
    expect(state.defaultCityId).toBe(2);
    expect(promptsState.logs).toEqual([
      { level: "success", message: "Ciudad default: Madrid, Madrid, España" },
    ]);
    expect(await loadState()).toEqual(state);
  });
});
