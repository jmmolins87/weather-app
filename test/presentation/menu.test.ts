import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import { answerSelect, promptsState, useIsolatedTestEnv } from "../helpers.ts";
import { main } from "../../src/presentation/menu.ts";
import { saveState } from "../../src/storage/state.ts";
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

function captureConsoleLog(): { printed: string[]; restore: () => void } {
  const printed: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    printed.push(args.map(String).join(" "));
  };
  return { printed, restore: () => void (console.log = originalLog) };
}

describe("menu", () => {
  test("numera las 9 opciones, muestra el banner y sale", async () => {
    const { printed, restore } = captureConsoleLog();
    try {
      answerSelect("exit");
      await main();
    } finally {
      restore();
    }
    expect(printed.join("\n")).toContain("WEATHER CLI");
    const options = promptsState.selectCalls[0]?.options ?? [];
    expect(options.map((option) => option.label)).toEqual([
      "1. Clima de ciudad default",
      "2. Clima de todas las ciudades (0)",
      "3. Listar ciudades guardadas",
      "4. Buscar y agregar ciudad",
      "5. Eliminar ciudad",
      "6. Establecer ciudad default",
      "7. Pronóstico 7 días",
      "8. Ajustes (°C)",
      "9. Salir",
    ]);
    expect(options[0]?.hint).toBe("sin establecer");
    expect(promptsState.outros).toEqual(["¡Hasta luego!"]);
  });

  test("refleja la ciudad default y la unidad guardada", async () => {
    await saveState({
      cities: [bogota],
      settings: { unit: "fahrenheit" },
      defaultCityId: 1,
    });
    answerSelect("exit");
    await main();
    const options = promptsState.selectCalls[0]?.options ?? [];
    expect(options[0]?.hint).toBe("Bogotá, Bogotá D.C., Colombia");
    expect(options[1]?.label).toBe("2. Clima de todas las ciudades (1)");
    expect(options[7]?.label).toBe("8. Ajustes (°F)");
  });
});
