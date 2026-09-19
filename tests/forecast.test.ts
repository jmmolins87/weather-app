import { afterEach, describe, expect, test, mock } from "bun:test";
import { getDailyForecast, getForecast } from "../src/api/weather.ts";

const realFetch = globalThis.fetch;
let lastUrl = "";

afterEach(() => {
  globalThis.fetch = realFetch;
  lastUrl = "";
});

function mockFetch(body: unknown, status = 200): void {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    lastUrl = String(input instanceof Request ? input.url : input);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("getForecast", () => {
  test("devuelve la temperatura actual con su unidad", async () => {
    mockFetch({
      current: { temperature_2m: 21.5 },
      current_units: { temperature_2m: "°C" },
    });
    const weather = await getForecast(4.61, -74.08, "celsius");
    expect(weather).toEqual({ temperature: 21.5, unit: "°C" });
  });

  test("envía coordenadas y unidad en la URL", async () => {
    mockFetch({ current: { temperature_2m: 70 }, current_units: { temperature_2m: "°F" } });
    await getForecast(40.41, -3.7, "fahrenheit");
    const url = new URL(lastUrl);
    expect(url.searchParams.get("latitude")).toBe("40.41");
    expect(url.searchParams.get("longitude")).toBe("-3.7");
    expect(url.searchParams.get("current")).toBe("temperature_2m");
    expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("usa la unidad pedida cuando la respuesta no trae unidades", async () => {
    mockFetch({ current: { temperature_2m: 20 } });
    const weather = await getForecast(4.61, -74.08, "celsius");
    expect(weather.unit).toBe("°C");
  });

  test("lanza error cuando falta la temperatura", async () => {
    mockFetch({ current: {} });
    await expect(getForecast(4.61, -74.08, "celsius")).rejects.toThrow("temperatura");
  });

  test("lanza error con el código HTTP", async () => {
    mockFetch({}, 503);
    await expect(getForecast(4.61, -74.08, "celsius")).rejects.toThrow("503");
  });
});

describe("getDailyForecast", () => {
  const dailyBody = {
    daily: {
      time: ["2026-01-01", "2026-01-02"],
      temperature_2m_max: [25, 26],
      temperature_2m_min: [15, 16],
    },
    daily_units: { temperature_2m_max: "°C" },
  };

  test("devuelve el pronóstico diario", async () => {
    mockFetch(dailyBody);
    const days = await getDailyForecast(4.61, -74.08, "celsius");
    expect(days).toEqual([
      { date: "2026-01-01", max: 25, min: 15, unit: "°C" },
      { date: "2026-01-02", max: 26, min: 16, unit: "°C" },
    ]);
  });

  test("pide 7 días con timezone auto", async () => {
    mockFetch(dailyBody);
    await getDailyForecast(4.61, -74.08, "celsius");
    const url = new URL(lastUrl);
    expect(url.searchParams.get("forecast_days")).toBe("7");
    expect(url.searchParams.get("timezone")).toBe("auto");
  });

  test("omite días con valores incompletos", async () => {
    mockFetch({
      daily: {
        time: ["2026-01-01", "2026-01-02"],
        temperature_2m_max: [25],
        temperature_2m_min: [15, 16],
      },
      daily_units: { temperature_2m_max: "°C" },
    });
    const days = await getDailyForecast(4.61, -74.08, "celsius");
    expect(days).toHaveLength(1);
    expect(days[0]?.date).toBe("2026-01-01");
  });

  test("lanza error cuando no hay datos diarios", async () => {
    mockFetch({ daily: {} });
    await expect(getDailyForecast(4.61, -74.08, "celsius")).rejects.toThrow(
      "pronóstico",
    );
  });

  test("lanza error con el código HTTP", async () => {
    mockFetch({}, 500);
    await expect(getDailyForecast(4.61, -74.08, "celsius")).rejects.toThrow("500");
  });
});
