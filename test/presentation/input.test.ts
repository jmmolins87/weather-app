import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import {
  CANCEL,
  answerSelect,
  answerText,
  promptsState,
  useIsolatedTestEnv,
} from "../helpers.ts";
import { promptText, selectCity, selectOption } from "../../src/presentation/input.ts";
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

describe("input", () => {
  test("selectOption devuelve el valor elegido", async () => {
    answerSelect("celsius");
    const picked = await selectOption("Unidad:", [
      { value: "celsius", label: "Celsius (°C)" },
    ]);
    expect(picked).toBe("celsius");
    expect(promptsState.selectCalls[0]?.message).toBe("Unidad:");
  });

  test("selectOption devuelve undefined al cancelar", async () => {
    answerSelect(CANCEL);
    const picked = await selectOption("Unidad:", [
      { value: "celsius", label: "Celsius (°C)" },
    ]);
    expect(picked).toBeUndefined();
  });

  test("selectCity mapea labels y hints", async () => {
    answerSelect(bogota);
    const picked = await selectCity("Ciudad:", [bogota], (city) =>
      city.id === 1 ? "actual" : undefined,
    );
    expect(picked).toEqual(bogota);
    expect(promptsState.selectCalls[0]?.options).toEqual([
      {
        value: bogota,
        label: "Bogotá, Bogotá D.C., Colombia",
        hint: "actual",
      },
    ]);
  });

  test("promptText recorta espacios", async () => {
    answerText("  Madrid  ");
    await expect(
      promptText("Nombre:", "Ej. Bogotá", "Ingresa un nombre"),
    ).resolves.toBe("Madrid");
    expect(promptsState.textCalls[0]?.message).toBe("Nombre:");
    expect(promptsState.textCalls[0]?.placeholder).toBe("Ej. Bogotá");
  });

  test("promptText devuelve undefined al cancelar", async () => {
    answerText(CANCEL);
    await expect(promptText("Nombre:", "", "Ingresa un nombre")).resolves.toBeUndefined();
  });

  test("la validación rechaza texto vacío", async () => {
    answerText("x");
    await promptText("Nombre:", "", "Ingresa un nombre");
    const validate = promptsState.textCalls[0]?.validate;
    expect(validate?.("")).toBe("Ingresa un nombre");
    expect(validate?.("   ")).toBe("Ingresa un nombre");
    expect(validate?.("Lima")).toBeUndefined();
  });
});
