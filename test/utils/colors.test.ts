import { describe, expect, test } from "bun:test";
import {
  colorError,
  colorSuccess,
  colorTemperature,
  colorTitle,
} from "../../src/utils/colors.ts";

describe("colors", () => {
  // picocolors desactiva los códigos ANSI fuera de un TTY; en ambos casos el
  // texto original debe conservarse dentro del resultado.
  test("los wrappers conservan el texto", () => {
    expect(colorTemperature("21.5 °C")).toContain("21.5 °C");
    expect(colorSuccess("ok")).toContain("ok");
    expect(colorError("falló")).toContain("falló");
    expect(colorTitle("WEATHER CLI")).toContain("WEATHER CLI");
  });

  test("devuelven strings", () => {
    for (const colorize of [colorTemperature, colorSuccess, colorError, colorTitle]) {
      expect(typeof colorize("x")).toBe("string");
    }
  });
});
