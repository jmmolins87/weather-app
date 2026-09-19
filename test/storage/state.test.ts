import { useIsolatedTestEnv } from "../helpers.ts";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  configDir,
  legacyStoragePath,
  loadState,
  saveState,
  storagePath,
} from "../../src/storage/state.ts";
import type { AppState } from "../../src/types/AppState.ts";

useIsolatedTestEnv();

const sampleState: AppState = {
  cities: [
    {
      id: 1,
      name: "Bogotá",
      country: "Colombia",
      admin1: "Bogotá D.C.",
      latitude: 4.6,
      longitude: -74.08,
      population: 7_000_000,
    },
  ],
  settings: { unit: "fahrenheit" },
  defaultCityId: 1,
};

describe("storage", () => {
  test("devuelve estado vacío cuando no hay archivos", async () => {
    expect(await loadState()).toEqual({ cities: [], settings: { unit: "celsius" } });
  });

  test("saveState crea el directorio y roundtrip conserva los datos", async () => {
    await saveState(sampleState);
    expect(await Bun.file(storagePath()).exists()).toBe(true);
    expect(await loadState()).toEqual(sampleState);
  });

  test("JSON corrupto devuelve estado vacío", async () => {
    await Bun.write(storagePath(), "esto no es json{{{");
    expect(await loadState()).toEqual({ cities: [], settings: { unit: "celsius" } });
  });

  test("datos parciales se rellenan con valores por defecto", async () => {
    await Bun.write(
      storagePath(),
      JSON.stringify({ settings: { unit: "kelvin" }, defaultCityId: "1" }),
    );
    expect(await loadState()).toEqual({
      cities: [],
      settings: { unit: "celsius" },
      defaultCityId: undefined,
    });
  });

  test("migra el archivo legado a la nueva ruta y lo borra", async () => {
    await Bun.write(legacyStoragePath(), JSON.stringify(sampleState));
    expect(await loadState()).toEqual(sampleState);
    expect(await Bun.file(storagePath()).exists()).toBe(true);
    expect(await Bun.file(legacyStoragePath()).exists()).toBe(false);
    // Segunda carga ya lee la ruta nueva.
    expect(await loadState()).toEqual(sampleState);
  });

  test("no migra si la nueva ruta ya existe", async () => {
    await saveState(sampleState);
    await Bun.write(legacyStoragePath(), JSON.stringify({ cities: [], settings: {} }));
    await loadState();
    expect(await Bun.file(legacyStoragePath()).exists()).toBe(true);
    expect(await loadState()).toEqual(sampleState);
  });

  test("legado corrupto devuelve estado vacío sin borrarlo", async () => {
    await Bun.write(legacyStoragePath(), "corrupto{{{");
    expect(await loadState()).toEqual({ cities: [], settings: { unit: "celsius" } });
    expect(await Bun.file(legacyStoragePath()).exists()).toBe(true);
  });

  test("configDir respeta XDG_CONFIG_HOME", () => {
    expect(configDir()).toBe(join(process.env.XDG_CONFIG_HOME ?? "", "weather-cli"));
  });

  test("configDir usa ~/.config cuando XDG_CONFIG_HOME no está definido", () => {
    delete process.env.XDG_CONFIG_HOME;
    expect(configDir()).toBe(join(process.env.HOME ?? "", ".config", "weather-cli"));
  });

  test("configDir ignora XDG_CONFIG_HOME relativo", () => {
    process.env.XDG_CONFIG_HOME = "relativo/config";
    expect(configDir()).toBe(join(process.env.HOME ?? "", ".config", "weather-cli"));
  });
});
