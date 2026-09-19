import * as p from "@clack/prompts";
import { APP_TITLE, BANNER_WIDTH } from "../utils/constants.ts";
import { colorError, colorSuccess, colorTemperature, colorTitle } from "../utils/colors.ts";
import { cityLabel } from "../utils/format.ts";
import type { City } from "../types/City.ts";
import type { CurrentWeather } from "../types/Weather.ts";

export function showBanner(): void {
  const border = "═".repeat(BANNER_WIDTH);
  const centered = APP_TITLE.padStart(
    Math.floor((BANNER_WIDTH + APP_TITLE.length) / 2),
  ).padEnd(BANNER_WIDTH);
  console.log(colorTitle(`${border}\n${centered}\n${border}`));
}

export function weatherMessage(city: City, weather: CurrentWeather): string {
  return `${cityLabel(city)} → ${colorTemperature(`${weather.temperature} ${weather.unit}`)}`;
}

export function weatherLine(city: City, weather: CurrentWeather): void {
  info(weatherMessage(city, weather));
}

export function startSpinner(message: string): ReturnType<typeof p.spinner> {
  const spinner = p.spinner();
  spinner.start(message);
  return spinner;
}

export function info(message: string): void {
  p.log.info(message);
}

export function success(message: string): void {
  p.log.success(colorSuccess(message));
}

export function warn(message: string): void {
  p.log.warn(message);
}

export function error(message: string): void {
  p.log.error(colorError(message));
}
