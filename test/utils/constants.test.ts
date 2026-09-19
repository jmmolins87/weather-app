import { describe, expect, test } from "bun:test";
import {
  APP_TITLE,
  BANNER_WIDTH,
  FORECAST_API_URL,
  GEOCODING_API_URL,
} from "../../src/utils/constants.ts";

describe("constants", () => {
  test("título y ancho del banner", () => {
    expect(APP_TITLE).toBe("WEATHER CLI");
    expect(BANNER_WIDTH).toBe(40);
  });

  test("URLs de la API de Open-Meteo", () => {
    expect(GEOCODING_API_URL).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(FORECAST_API_URL).toBe("https://api.open-meteo.com/v1/forecast");
  });
});
