import { useIsolatedTestEnv } from "../helpers.ts";
import { describe, expect, test } from "bun:test";
import { setUnit } from "../../src/storage/settingsStorage.ts";
import { loadState } from "../../src/storage/state.ts";
import type { AppState } from "../../src/types/AppState.ts";

useIsolatedTestEnv();

describe("setUnit", () => {
  test("cambia la unidad y la persiste", async () => {
    const state: AppState = { cities: [], settings: { unit: "celsius" } };
    await setUnit(state, "fahrenheit");
    expect(state.settings.unit).toBe("fahrenheit");
    expect((await loadState()).settings.unit).toBe("fahrenheit");
  });

  test("permite volver a celsius", async () => {
    const state: AppState = { cities: [], settings: { unit: "fahrenheit" } };
    await setUnit(state, "celsius");
    expect(state.settings.unit).toBe("celsius");
    expect((await loadState()).settings.unit).toBe("celsius");
  });
});
