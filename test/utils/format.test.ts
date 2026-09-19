import { describe, expect, test } from "bun:test";
import {
  cityLabel,
  errorMessage,
  formatDay,
  populationHint,
  unitSymbol,
} from "../../src/utils/format.ts";
import type { City } from "../../src/types/City.ts";

const bogota: City = {
  id: 1,
  name: "Bogotá",
  country: "Colombia",
  admin1: "Bogotá D.C.",
  latitude: 4.6,
  longitude: -74.08,
  population: 7_000_000,
};

describe("cityLabel", () => {
  test("une nombre, admin1 y país", () => {
    expect(cityLabel(bogota)).toBe("Bogotá, Bogotá D.C., Colombia");
  });

  test("omite admin1 cuando no existe", () => {
    expect(cityLabel({ ...bogota, admin1: undefined })).toBe("Bogotá, Colombia");
  });

  test("omite partes vacías", () => {
    expect(cityLabel({ ...bogota, admin1: "", country: "" })).toBe("Bogotá");
  });
});

describe("populationHint", () => {
  test("devuelve undefined sin población o con valor no positivo", () => {
    expect(populationHint({ ...bogota, population: undefined })).toBeUndefined();
    expect(populationHint({ ...bogota, population: 0 })).toBeUndefined();
    expect(populationHint({ ...bogota, population: -5 })).toBeUndefined();
  });

  test("formatea la población en compacto", () => {
    const hint = populationHint(bogota);
    expect(hint).toContain("≈");
    expect(hint).toContain("habitantes");
  });
});

describe("errorMessage", () => {
  test("extrae el mensaje de un Error", () => {
    expect(errorMessage(new Error("falló la red"))).toBe("falló la red");
  });

  test("convierte otros valores a texto", () => {
    expect(errorMessage("texto plano")).toBe("texto plano");
    expect(errorMessage(42)).toBe("42");
  });
});

describe("unitSymbol", () => {
  test("celsius es °C y fahrenheit es °F", () => {
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });
});

describe("formatDay", () => {
  test("formatea la fecha en español con mes abreviado", () => {
    const formatted = formatDay("2026-01-01");
    expect(typeof formatted).toBe("string");
    expect(formatted).toContain("ene");
  });
});
