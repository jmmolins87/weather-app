import { useIsolatedTestEnv } from "../helpers.ts";
import { describe, expect, test } from "bun:test";
import {
  addCity,
  findDefaultCity,
  removeCity,
  setDefaultCity,
} from "../../src/storage/citiesStorage.ts";
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

function emptyState(): AppState {
  return { cities: [], settings: { unit: "celsius" } };
}

describe("findDefaultCity", () => {
  test("devuelve la ciudad marcada como default", () => {
    const state: AppState = { ...emptyState(), cities: [bogota, madrid], defaultCityId: 2 };
    expect(findDefaultCity(state)).toEqual(madrid);
  });

  test("devuelve undefined sin default o con id desconocido", () => {
    expect(findDefaultCity({ ...emptyState(), cities: [bogota] })).toBeUndefined();
    expect(
      findDefaultCity({ ...emptyState(), cities: [bogota], defaultCityId: 99 }),
    ).toBeUndefined();
  });
});

describe("addCity", () => {
  test("agrega la ciudad y la persiste", async () => {
    const state = emptyState();
    await addCity(state, bogota);
    expect(state.cities).toEqual([bogota]);
    expect(await loadState()).toEqual(state);
  });
});

describe("removeCity", () => {
  test("elimina la ciudad, la devuelve y la persiste", async () => {
    const state: AppState = {
      ...emptyState(),
      cities: [bogota, madrid],
      defaultCityId: 2,
    };
    const removed = await removeCity(state, 1);
    expect(removed).toEqual(bogota);
    expect(state.cities).toEqual([madrid]);
    expect(state.defaultCityId).toBe(2);
    expect(await loadState()).toEqual(state);
  });

  test("limpia el default cuando se elimina la ciudad default", async () => {
    const state: AppState = {
      ...emptyState(),
      cities: [bogota],
      defaultCityId: 1,
    };
    await removeCity(state, 1);
    expect(state.cities).toEqual([]);
    expect(state.defaultCityId).toBeUndefined();
    expect(await loadState()).toEqual(state);
  });

  test("id desconocido no cambia nada y devuelve undefined", async () => {
    const state: AppState = {
      ...emptyState(),
      cities: [bogota],
      defaultCityId: 1,
    };
    expect(await removeCity(state, 99)).toBeUndefined();
    expect(state.cities).toEqual([bogota]);
    expect(state.defaultCityId).toBe(1);
  });
});

describe("setDefaultCity", () => {
  test("establece el default, lo devuelve y lo persiste", async () => {
    const state: AppState = { ...emptyState(), cities: [bogota, madrid] };
    const city = await setDefaultCity(state, 2);
    expect(city).toEqual(madrid);
    expect(state.defaultCityId).toBe(2);
    expect(await loadState()).toEqual(state);
  });

  test("id desconocido guarda el id pero devuelve undefined", async () => {
    const state: AppState = { ...emptyState(), cities: [bogota] };
    expect(await setDefaultCity(state, 99)).toBeUndefined();
    expect(state.defaultCityId).toBe(99);
  });
});
