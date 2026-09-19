import { describe, expect, mock, test } from "bun:test";
import { promptsMockFactory } from "../helpers.ts";

mock.module("@clack/prompts", () => promptsMockFactory());

import { promptsState, useIsolatedTestEnv } from "../helpers.ts";
import {
  error,
  info,
  showBanner,
  startSpinner,
  success,
  warn,
  weatherLine,
  weatherMessage,
} from "../../src/presentation/output.ts";
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

describe("output", () => {
  test("weatherMessage combina ciudad y temperatura", () => {
    expect(weatherMessage(bogota, { temperature: 21.5, unit: "°C" })).toContain(
      "Bogotá, Bogotá D.C., Colombia",
    );
    expect(weatherMessage(bogota, { temperature: 21.5, unit: "°C" })).toContain(
      "21.5 °C",
    );
  });

  test("weatherLine registra un info", () => {
    weatherLine(bogota, { temperature: 21.5, unit: "°C" });
    expect(promptsState.logs).toHaveLength(1);
    expect(promptsState.logs[0]?.level).toBe("info");
    expect(promptsState.logs[0]?.message).toContain("21.5");
  });

  test("info/success/warn/error registran su nivel", () => {
    info("i");
    success("s");
    warn("w");
    error("e");
    expect(promptsState.logs).toEqual([
      { level: "info", message: "i" },
      { level: "success", message: "s" },
      { level: "warn", message: "w" },
      { level: "error", message: "e" },
    ]);
  });

  test("startSpinner captura inicio y fin", () => {
    const spinner = startSpinner("Cargando...");
    spinner.stop("Listo");
    spinner.stop();
    expect(promptsState.spinnerStarts).toEqual(["Cargando..."]);
    expect(promptsState.spinnerStops).toEqual(["Listo", undefined]);
  });

  test("showBanner imprime el título", () => {
    const printed: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      printed.push(args.map(String).join(" "));
    };
    try {
      showBanner();
    } finally {
      console.log = originalLog;
    }
    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain("WEATHER CLI");
  });
});
