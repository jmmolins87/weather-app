import { mockFetchError, mockFetchJson, useIsolatedTestEnv } from "../helpers.ts";
import { describe, expect, test } from "bun:test";
import { searchCities } from "../../src/api/geocoding.ts";

useIsolatedTestEnv();

describe("searchCities", () => {
  test("mapea los resultados de la API", async () => {
    mockFetchJson({
      results: [
        {
          id: 3688689,
          name: "Bogotá",
          country: "Colombia",
          admin1: "Bogotá D.C.",
          latitude: 4.61,
          longitude: -74.08,
          population: 7674366,
        },
      ],
    });
    const cities = await searchCities("bogota");
    expect(cities).toHaveLength(1);
    expect(cities[0]).toEqual({
      id: 3688689,
      name: "Bogotá",
      country: "Colombia",
      admin1: "Bogotá D.C.",
      latitude: 4.61,
      longitude: -74.08,
      population: 7674366,
    });
  });

  test("envía count, language y el nombre buscado", async () => {
    const { urls } = mockFetchJson({ results: [] });
    await searchCities("Madrid");
    const url = new URL(urls[0] as string);
    expect(url.searchParams.get("name")).toBe("Madrid");
    expect(url.searchParams.get("count")).toBe("10");
    expect(url.searchParams.get("language")).toBe("es");
  });

  test("elimina duplicados exactos", async () => {
    const entry = {
      id: 1,
      name: "Lima",
      country: "Perú",
      admin1: "Lima",
      latitude: -12.04,
      longitude: -77.03,
    };
    mockFetchJson({ results: [entry, { ...entry }] });
    expect(await searchCities("lima")).toHaveLength(1);
  });

  test("devuelve arreglo vacío cuando no hay resultados", async () => {
    mockFetchJson({});
    expect(await searchCities("xyzzy")).toEqual([]);
  });

  test("lanza error con el código HTTP", async () => {
    mockFetchError(500);
    await expect(searchCities("bogota")).rejects.toThrow("500");
  });
});
