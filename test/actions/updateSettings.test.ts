import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { run } from "../../src/actions/updateSettings.ts";
import { loadState } from "../../src/storage/state.ts";
import type { AppState } from "../../src/types/AppState.ts";

useIsolatedTestEnv();

describe("updateSettings action", () => {
  test("cancelar no cambia la unidad", async () => {
    const state: AppState = { cities: [], settings: { unit: "celsius" } };
    answerSelect(CANCEL);
    await run(state);
    expect(state.settings.unit).toBe("celsius");
    expect(promptsState.logs).toEqual([
      { level: "warn", message: "Ajustes cancelados" },
    ]);
  });

  test("ofrece ambas unidades marcando la actual", async () => {
    const state: AppState = { cities: [], settings: { unit: "celsius" } };
    answerSelect("fahrenheit");
    await run(state);
    expect(promptsState.selectCalls[0]?.message).toBe("Unidad de temperatura:");
    expect(promptsState.selectCalls[0]?.options).toEqual([
      { value: "celsius", label: "Celsius (°C)", hint: "actual" },
      { value: "fahrenheit", label: "Fahrenheit (°F)", hint: undefined },
    ]);
  });

  test("guarda fahrenheit y lo persiste", async () => {
    const state: AppState = { cities: [], settings: { unit: "celsius" } };
    answerSelect("fahrenheit");
    await run(state);
    expect(state.settings.unit).toBe("fahrenheit");
    expect(promptsState.logs).toEqual([
      { level: "success", message: "Unidad guardada: °F" },
    ]);
    expect((await loadState()).settings.unit).toBe("fahrenheit");
  });

  test("guarda celsius y lo persiste", async () => {
    const state: AppState = { cities: [], settings: { unit: "fahrenheit" } };
    answerSelect("celsius");
    await run(state);
    expect(state.settings.unit).toBe("celsius");
    expect(promptsState.logs).toEqual([
      { level: "success", message: "Unidad guardada: °C" },
    ]);
    expect((await loadState()).settings.unit).toBe("celsius");
  });
});
